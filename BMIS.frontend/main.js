require('dotenv').config()
const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('node:path')

async function getFreePort() {
    const net = require('net');
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });

        server.on('error', (err) => {
            reject(err);
        });
    });
}

async function startBackend(port) {
    const { spawn } = require('child_process');
    const url = `http://localhost:${port}`;

    console.log(`[!] STARTING BACKEND @ ${url} `);
    
    // SPAWN BACKEND PROCESS 
    
    // for DEV run backend using cli
    if(!app.isPackaged) {

        const fs = require('fs');
        if(!fs.existsSync('../dev.backend')){
            console.log('\n\n[!] Err: missing dev files \n please run "node dev.js"\n\n'); 
            app.quit();
            return;
        } else {
            // requires whole backend project
            console.log('running dotnet'); 
            await spawn(`dotnet ../dev.backend/bmis.dll dev --urls ${url}`, { shell: true, stdio: 'inherit'});
        }

        /*
         * uncomment to see backend startup information
         *
        cmd.stdout.on('data', (data) => {
            console.log("OUPUT " + data);
        });
        
        cmd.stderr.on('data', (data) => {
            console.log("ERROR " + data);
        });
        */
    }

    // for PROD run the executable
    // TODO:
    //  build production read backend
    //  run executable using spawn
   

    // wait for backend to finish loading
    // (30) attempts (1sec) each = 30sec timeout
    let attempt = 0;
    while(attempt < 30) {
        try {
            const response = await fetch(url);
            console.log(`[~] SUCCESS: backend connected ${url}`); 
            return;
        } catch (err) {
            console.log(`[!] FAILED(${attempt}): backend connect failed ${url}`); 
            attempt++;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    console.log(`\n\n[!] ERROR: BACKEND FAILED ${url}\n\n`);
    app.quit();
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
    let port = await getFreePort();
    await startBackend(port); 

    ipcMain.handle('get-api-port', () => { 
        return port;
    });

    ipcMain.handle('get-data', async (event, endpoint) => { 
        const url = `http://localhost:${port}/${endpoint.replace(/^\//, '')}`;

        try {
            const response = await fetch(url);

            if(response.ok) {
                return { 
                    success: true,
                    message: `[~] request ${response.status}: GET ${url}`,
                    data: await response.json()
                };
            } else {
                return { 
                    success: false,
                    message: `[!] request ${response.status}: GET ${url}`,
                    data: null 
                };
            }
        } catch(err) {
            return { 
                success: false,
                message: `[!] request failed: GET ${url} -> ${err.message}`,
                data: null 
            };
        }
    });

    ipcMain.handle('check-login', (e, username, password) => {
        // commented out for faster development
        // return username === process.env.UN && password === process.env.PW

        return username === 'user' && password === 'password'
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
