const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('env', {
    username: process.env.UN,
    password: process.env.PW
})

contextBridge.exposeInMainWorld('electronAPI', {
    checkLogin: (username, password) => ipcRenderer.invoke('check-login', username, password)
})