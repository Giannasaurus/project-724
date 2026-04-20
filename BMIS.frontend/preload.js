const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getApiPort: () => ipcRenderer.invoke('get-api-port'),
    getData: (endpoint) => ipcRenderer.invoke('get-data', endpoint),
    postData: (endpoint, body) => ipcRenderer.invoke('post-data', endpoint, body),
    deleteData: (endpoint, id) => ipcRenderer.invoke('delete-data', endpoint, id),
    checkLogin: (username, password) => ipcRenderer.invoke('check-login', username, password),
})
