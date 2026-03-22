require('dotenv').config()
const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('node:path')

/*
function checkLogin(username, password, loginErrorMessage) {
    console.log(username, password)
    
    if (username.value === un && password.value === pw) {
        return username, password
    } else {
        
        return loginErrorMessage
    } 
}
*/

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

app.whenReady().then(() => {
    ipcMain.handle('check-login', (e, username, password) => {
        return username === process.env.UN && password === process.env.PW
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
                click(item, focusedWindow) {
                    focusedWindow.toggleDevTools()
                }
            },
            {
                role: 'reload'
            }
        ]
    })
}

// Persist login credentials (development)
