const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getApiPort: () => ipcRenderer.invoke('get-api-port'),
    getData: (endpoint) => ipcRenderer.invoke('get-data', endpoint),
    postData: (endpoint, body) => ipcRenderer.invoke('post-data', endpoint, body),
    updateData: (endpoint, body) => ipcRenderer.invoke('update-data', endpoint, body),
    deleteData: (endpoint, id) => ipcRenderer.invoke('delete-data', endpoint, id),
    checkLogin: (username, password) => ipcRenderer.invoke('check-login', username, password),
    readResidentsExcel: () => ipcRenderer.invoke('read-residents-excel'),
    saveWordDocument: (html, fileName, context) => ipcRenderer.invoke('save-word-document', html, fileName, context),
    exportAppBackup: (localData) => ipcRenderer.invoke('export-app-backup', localData),
    readAppBackup: () => ipcRenderer.invoke('read-app-backup'),
    restoreBackupDatabase: (database) => ipcRenderer.invoke('restore-backup-database', database),
})
