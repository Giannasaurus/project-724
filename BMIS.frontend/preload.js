const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    getApiPort: () => ipcRenderer.invoke('get-api-port'),
    getData: (endpoint) => ipcRenderer.invoke('get-data', endpoint),
    postData: (endpoint, body) => ipcRenderer.invoke('post-data', endpoint, body),
    updateData: (endpoint, body) => ipcRenderer.invoke('update-data', endpoint, body),
    readResidentsExcel: () => ipcRenderer.invoke('read-residents-excel'),
    saveWordDocument: (html, fileName, context) => ipcRenderer.invoke('save-word-document', html, fileName, context),
    sendDocumentReadyEmail: (request) => ipcRenderer.invoke('send-document-ready-email', request),
    sendIncidentNotification: (request) => ipcRenderer.invoke('send-incident-notification', request),
    exportAppBackup: (localData) => ipcRenderer.invoke('export-app-backup', localData),
    readAppBackup: () => ipcRenderer.invoke('read-app-backup'),
    restoreBackupDatabase: (database) => ipcRenderer.invoke('restore-backup-database', database),
})
