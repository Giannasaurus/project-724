const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    checkLogin: (username, password) => ipcRenderer.invoke('check-login', username, password)
})