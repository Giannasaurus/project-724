const DOCUMENT_DEFAULTS_KEY = 'bmisDocumentDefaults'

export const DEFAULT_DOCUMENT_DEFAULTS = {
    barangayName: 'Barangay 724',
    barangayZone: 'Zone 79, District V',
    barangayAddress: '2207 Singalong Street, Malate Manila',
    chairName: 'ROLANDO V. NAVARRO',
    chairTitle: 'Punong Barangay',
    email: 'barangay724zone79@gmail.com',
    facebook: 'Barangay 724 Zone 79'
}

export function getDocumentDefaults() {
    try {
        const stored = JSON.parse(localStorage.getItem(DOCUMENT_DEFAULTS_KEY) ?? '{}')
        return {
            ...DEFAULT_DOCUMENT_DEFAULTS,
            ...stored
        }
    }
    catch {
        return { ...DEFAULT_DOCUMENT_DEFAULTS }
    }
}

export function saveDocumentDefaults(defaults) {
    const nextDefaults = {
        ...DEFAULT_DOCUMENT_DEFAULTS,
        ...defaults
    }

    localStorage.setItem(DOCUMENT_DEFAULTS_KEY, JSON.stringify(nextDefaults))
    return nextDefaults
}

export function resetDocumentDefaults() {
    localStorage.removeItem(DOCUMENT_DEFAULTS_KEY)
    return { ...DEFAULT_DOCUMENT_DEFAULTS }
}
