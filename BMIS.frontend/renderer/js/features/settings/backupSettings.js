const BACKUP_LOCAL_STORAGE_KEYS = [
    'bmisDocumentDefaults',
    'bmisActivityLogSettings',
    'bmisResidentHistory',
    'bmisHouseholds'
]

export function createLocalBackupData() {
    return {
        storage: BACKUP_LOCAL_STORAGE_KEYS.reduce((values, key) => {
            values[key] = localStorage.getItem(key)
            return values
        }, {})
    }
}

export function restoreLocalBackupData(localData = {}) {
    const previousData = createLocalBackupData()
    const storage = localData.storage ?? {}

    BACKUP_LOCAL_STORAGE_KEYS.forEach((key) => {
        const value = storage[key]

        if (value === null || typeof value === 'undefined') {
            localStorage.removeItem(key)
            return
        }

        localStorage.setItem(key, String(value))
    })

    return previousData
}

export function rollbackLocalBackupData(previousData) {
    if (!previousData) return
    restoreLocalBackupData(previousData)
}

export function getBackupSummary(backup) {
    const createdAt = backup?.createdAt
        ? new Date(backup.createdAt).toLocaleString()
        : 'Unknown date'

    return `${backup?.app ?? 'BMIS'} backup created ${createdAt}.`
}
