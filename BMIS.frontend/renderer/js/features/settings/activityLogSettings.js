const ACTIVITY_LOG_SETTINGS_KEY = 'bmisActivityLogSettings'

export const DEFAULT_ACTIVITY_LOG_SETTINGS = {
    enabled: true,
    maxEntries: 100
}

export function getActivityLogSettings() {
    try {
        const stored = JSON.parse(localStorage.getItem(ACTIVITY_LOG_SETTINGS_KEY) ?? '{}')
        return normalizeActivityLogSettings({
            ...DEFAULT_ACTIVITY_LOG_SETTINGS,
            ...stored
        })
    }
    catch {
        return { ...DEFAULT_ACTIVITY_LOG_SETTINGS }
    }
}

export function saveActivityLogSettings(settings) {
    const nextSettings = normalizeActivityLogSettings({
        ...DEFAULT_ACTIVITY_LOG_SETTINGS,
        ...settings
    })

    localStorage.setItem(ACTIVITY_LOG_SETTINGS_KEY, JSON.stringify(nextSettings))
    return nextSettings
}

export function resetActivityLogSettings() {
    localStorage.removeItem(ACTIVITY_LOG_SETTINGS_KEY)
    return { ...DEFAULT_ACTIVITY_LOG_SETTINGS }
}

function normalizeActivityLogSettings(settings) {
    const maxEntries = Number(settings.maxEntries)

    return {
        enabled: Boolean(settings.enabled),
        maxEntries: Number.isFinite(maxEntries)
            ? Math.min(500, Math.max(10, Math.round(maxEntries)))
            : DEFAULT_ACTIVITY_LOG_SETTINGS.maxEntries
    }
}
