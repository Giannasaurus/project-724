const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getApiPort: () => ipcRenderer.invoke('get-api-port'),
    getData: (endpoint) => ipcRenderer.invoke('get-data', endpoint),
    checkLogin: (username, password) => ipcRenderer.invoke('check-login', username, password),
})
