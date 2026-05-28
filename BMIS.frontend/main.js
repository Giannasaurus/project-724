require('dotenv').config()
const { app, BrowserWindow, Menu, ipcMain, dialog, safeStorage, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')
const { createWordDocumentBuffer } = require('./documentExport.js')

let backendProcess = null
const BACKUP_MAGIC = 'BMISBACKUP1'

function getDevBackendDirectory() {
    return path.join(__dirname, '..', 'dev.backend')
}

function getDatabasePath() {
    const candidates = app.isPackaged
        ? [
            path.join(process.resourcesPath, 'LocalDatabase.db'),
            path.join(path.dirname(app.getPath('exe')), 'LocalDatabase.db')
        ]
        : [
            path.join(getDevBackendDirectory(), 'LocalDatabase.db')
        ]

    return candidates[0]
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath)
        return true
    }
    catch {
        return false
    }
}

async function readJsonOrNull(response) {
    const body = await response.text()
    if (!body) return null

    try {
        return JSON.parse(body)
    }
    catch {
        return body
    }
}

function ensureBackupExtension(filePath) {
    return filePath.toLowerCase().endsWith('.bmis-backup')
        ? filePath
        : `${filePath}.bmis-backup`
}

function encryptBackupPayload(backup) {
    if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Backup encryption is not available on this device.')
    }

    const encrypted = safeStorage.encryptString(JSON.stringify(backup))
    return `${BACKUP_MAGIC}\n${encrypted.toString('base64')}`
}

function decryptBackupPayload(content) {
    if (content.startsWith(`${BACKUP_MAGIC}\n`)) {
        if (!safeStorage.isEncryptionAvailable()) {
            throw new Error('Backup decryption is not available on this device.')
        }

        const encrypted = Buffer.from(content.slice(BACKUP_MAGIC.length + 1), 'base64')
        return JSON.parse(safeStorage.decryptString(encrypted))
    }

    return JSON.parse(content)
}

async function stopBackendProcess() {
    if (!backendProcess || backendProcess.killed) return

    await new Promise((resolve) => {
        const processToStop = backendProcess
        const fallbackTimer = setTimeout(resolve, 1500)

        processToStop.once('exit', () => {
            clearTimeout(fallbackTimer)
            resolve()
        })

        processToStop.kill()
        backendProcess = null
    })
}

async function getFreePort() {
    const net = require('net')
    return new Promise((resolve, reject) => {
        const server = net.createServer()
        server.listen(0, () => {
            const { port } = server.address()
            server.close(() => resolve(port))
        })

        server.on('error', (err) => {
            reject(err)
        })
    })
}

async function startBackend(port) {
    const { spawn } = require('child_process')
    const url = `http://localhost:${port}`

    console.log(`[!] STARTING BACKEND @ ${url} `)

    // SPAWN BACKEND PROCESS 

    // for DEV run backend using cli
    if (!app.isPackaged) {

        const fs = require('fs')
        const backendDirectory = getDevBackendDirectory()
        const backendDllPath = path.join(backendDirectory, 'bmis.dll')

        if (!fs.existsSync(backendDllPath)) {
            console.log('\n\n[!] Err: missing dev files \n please run "node dev.js"\n\n')
            app.quit()
            return
        }
        else {
            // requires whole backend project
            console.log('running dotnet')
            backendProcess = spawn('dotnet', [backendDllPath, 'dev', '--urls', url], {
                cwd: backendDirectory,
                stdio: 'inherit'
            })

            backendProcess.once('exit', () => {
                backendProcess = null
            })
        }

        /*
         * uncomment to see backend startup information
         *
        cmd.stdout.on('data', (data) => {
            console.log("OUPUT " + data)
        })
        
        cmd.stderr.on('data', (data) => {
            console.log("ERROR " + data)
        })
        */
    }

    // for PROD run the executable
    // TODO:
    //  build production read backend
    //  run executable using spawn


    // wait for backend to finish loading
    // (30) attempts (1sec) each = 30sec timeout
    let attempt = 0;
    while (attempt < 30) {
        try {
            const response = await fetch(url)
            console.log(`[~] SUCCESS: backend connected ${url}`)
            return
        }
        catch (err) {
            console.log(`[!] FAILED(${attempt}): backend connect failed ${url}`)
            attempt++
            await new Promise((resolve) => setTimeout(resolve, 1000))
        }
    }

    console.log(`\n\n[!] ERROR: BACKEND FAILED ${url}\n\n`)
    app.quit()
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('renderer/index.html')
}

app.whenReady().then(async () => {
    let port = await getFreePort()
    await startBackend(port)

    ipcMain.handle('get-api-port', () => {
        return port
    })

    ipcMain.handle('get-data', async (e, endpoint) => {
        const url = `http://localhost:${port}/${endpoint.replace(/^\//, '')}`

        try {
            const response = await fetch(url)

            if (response.ok) {
                return {
                    success: true,
                    message: `[~] request ${response.status}: GET ${url}`,
                    data: await response.json()
                }
            }
            else {
                return {
                    success: false,
                    message: `[!] request ${response.status}: GET ${url}`,
                    data: null
                }
            }
        }
        catch (err) {
            return {
                success: false,
                message: `[!] request failed: GET ${url} -> ${err.message}`,
                data: null
            }
        }
    })

    ipcMain.handle('post-data', async (e, endpoint, body) => {
        const url = `http://localhost:${port}/${endpoint.replace(/^\//, '')}`

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (response.ok) {
                return {
                    success: true,
                    message: `[~] request ${response.status}: POST ${url}`,
                    data: await readJsonOrNull(response)
                }
            }
            else {
                return {
                    success: false,
                    status: response.status,
                    message: `[!] request ${response.status}: POST ${url}`,
                    data: null
                }
            }
        }
        catch (err) {
            return {
                success: false,
                message: `[!] request failed: POST ${url} -> ${err.message}`,
                data: null
            }
        }
    })

    ipcMain.handle('update-data', async (e, endpoint, body) => {
        const url = `http://localhost:${port}/${endpoint.replace(/^\//, '')}`

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            })

            if (response.ok) {
                return {
                    success: true,
                    message: `[~] request ${response.status}: PUT ${url}`,
                    data: response.status === 204 ? null : await response.json()
                }
            }
            else {
                return {
                    success: false,
                    message: `[!] request ${response.status}: PUT ${url}`,
                    data: null
                }
            }
        }
        catch (err) {
            return {
                success: false,
                message: `[!] request failed: PUT ${url} -> ${err.message}`,
                data: null
            }
        }
    })

    ipcMain.handle('read-residents-excel', async () => {
        const result = await dialog.showOpenDialog({
            title: 'Import residents from spreadsheet',
            properties: ['openFile'],
            filters: [
                { name: 'Spreadsheet files (.xlsx, .xls, .csv)', extensions: ['xlsx', 'xls', 'csv'] },
                { name: 'CSV files (.csv)', extensions: ['csv'] },
                { name: 'Excel workbooks (.xlsx, .xls)', extensions: ['xlsx', 'xls'] }
            ]
        })

        if (result.canceled || result.filePaths.length === 0) {
            return { success: true, canceled: true, rows: [] }
        }

        try {
            const XLSX = require('xlsx')
            const filePath = result.filePaths[0]
            const workbook = XLSX.readFile(filePath, { cellDates: true })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const rows = XLSX.utils.sheet_to_json(worksheet, {
                defval: '',
                raw: false
            })

            return {
                success: true,
                canceled: false,
                fileName: path.basename(filePath),
                rows
            }
        }
        catch (err) {
            return {
                success: false,
                message: `[!] failed to read spreadsheet: ${err.message}`,
                rows: []
            }
        }
    })

    ipcMain.handle('save-word-document', async (e, html, fileName, context) => {
        const result = await dialog.showSaveDialog({
            title: 'Save Word document',
            defaultPath: fileName,
            filters: [
                { name: 'Word document', extensions: ['docx'] }
            ]
        })

        if (result.canceled || !result.filePath) {
            return { success: true, canceled: true }
        }

        try {
            const outputPath = result.filePath.toLowerCase().endsWith('.docx')
                ? result.filePath
                : `${result.filePath}.docx`
            const buffer = await createWordDocumentBuffer({ html, context })

            await fs.writeFile(outputPath, buffer)

            return {
                success: true,
                canceled: false,
                filePath: outputPath
            }
        }
        catch (err) {
            return {
                success: false,
                message: `[!] failed to save Word document: ${err.message}`
            }
        }
    })

    ipcMain.handle('send-document-ready-email', async (e, request) => {
        if (!request?.email) {
            return {
                success: false,
                message: 'Resident email is not recorded.'
            }
        }

        const subject = encodeURIComponent(`${request.documentLabel} ready for pickup`)
        const body = encodeURIComponent(
            `Good day ${request.residentName},\n\nYour ${request.documentLabel} request is ready for pickup at the barangay office.\n\nThank you.`
        )

        await shell.openExternal(`mailto:${encodeURIComponent(request.email)}?subject=${subject}&body=${body}`)

        return { success: true }
    })

    ipcMain.handle('send-incident-notification', async (e, request) => {
        const emails = Array.isArray(request?.emails) ? request.emails.filter(Boolean) : []
        if (emails.length === 0) {
            return {
                success: false,
                message: 'No email addresses were provided.'
            }
        }

        const subject = encodeURIComponent(request.subject ?? 'Barangay case notice')
        const body = encodeURIComponent(request.message ?? '')

        await shell.openExternal(`mailto:${emails.map(encodeURIComponent).join(',')}?subject=${subject}&body=${body}`)

        return { success: true }
    })

    ipcMain.handle('export-app-backup', async (e, localData) => {
        const now = new Date()
        const defaultPath = `BMIS backup ${now.toISOString().slice(0, 10)}.bmis-backup`
        const result = await dialog.showSaveDialog({
            title: 'Create BMIS backup',
            defaultPath,
            filters: [
                { name: 'BMIS backup', extensions: ['bmis-backup'] },
                { name: 'JSON backup', extensions: ['json'] }
            ]
        })

        if (result.canceled || !result.filePath) {
            return { success: true, canceled: true }
        }

        try {
            const databasePath = getDatabasePath()
            if (!await fileExists(databasePath)) {
                return {
                    success: false,
                    message: `Database file was not found at ${databasePath}.`
                }
            }

            const databaseBuffer = await fs.readFile(databasePath)
            const backup = {
                app: 'Barangay 724 BMIS',
                format: 'bmis-backup',
                version: 1,
                createdAt: now.toISOString(),
                database: {
                    fileName: 'LocalDatabase.db',
                    base64: databaseBuffer.toString('base64')
                },
                localData: localData ?? {}
            }
            const outputPath = ensureBackupExtension(result.filePath)

            await fs.writeFile(outputPath, encryptBackupPayload(backup), 'utf8')

            return {
                success: true,
                canceled: false,
                filePath: outputPath
            }
        }
        catch (err) {
            return {
                success: false,
                message: `[!] failed to create backup: ${err.message}`
            }
        }
    })

    ipcMain.handle('read-app-backup', async () => {
        const result = await dialog.showOpenDialog({
            title: 'Restore BMIS backup',
            properties: ['openFile'],
            filters: [
                { name: 'BMIS backup', extensions: ['bmis-backup', 'json'] }
            ]
        })

        if (result.canceled || result.filePaths.length === 0) {
            return { success: true, canceled: true }
        }

        try {
            const filePath = result.filePaths[0]
            const backup = decryptBackupPayload(await fs.readFile(filePath, 'utf8'))

            if (backup?.format !== 'bmis-backup' || !backup?.database?.base64) {
                return {
                    success: false,
                    message: 'Selected file is not a valid BMIS backup.'
                }
            }

            return {
                success: true,
                canceled: false,
                filePath,
                backup
            }
        }
        catch (err) {
            return {
                success: false,
                message: `[!] failed to read backup: ${err.message}`
            }
        }
    })

    ipcMain.handle('restore-backup-database', async (e, database) => {
        try {
            if (!database?.base64) {
                return {
                    success: false,
                    message: 'Backup database is missing.'
                }
            }

            const databasePath = getDatabasePath()
            const databaseDir = path.dirname(databasePath)
            const restoredBuffer = Buffer.from(database.base64, 'base64')

            await stopBackendProcess()
            await fs.mkdir(databaseDir, { recursive: true })
            await fs.writeFile(databasePath, restoredBuffer)

            setTimeout(() => {
                app.relaunch()
                app.exit(0)
            }, 600)

            return {
                success: true,
                requiresRestart: true
            }
        }
        catch (err) {
            return {
                success: false,
                message: `[!] failed to restore database: ${err.message}`
            }
        }
    })
    createWindow()

    // for MacOS
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate)
    Menu.setApplicationMenu(mainMenu)
})

// for Windows and Linux
app.on('window-all-closed', () => {
    stopBackendProcess()
    if (process.platform != 'darwin') app.quit()
})

const mainMenuTemplate = [
    {
        label: 'Quit',
        accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click() {
            app.quit()
        }
    }
]

if (process.env.NODE_ENV !== 'production') {
    mainMenuTemplate.push({
        label: 'Developer Tools',
        submenu: [
            {
                label: 'Toggle Devtools',
                accelerator: process.platform == 'darwin' ? 'Fn+F12' : 'F12',
                click(_, focusedWindow) {
                    focusedWindow.toggleDevTools()
                }
            },
            {
                role: 'reload'
            }
        ]
    })
}
