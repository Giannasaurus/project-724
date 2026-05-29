export const BLOTTER_STORAGE_KEY = 'bmisIncidentCases'

const CASE_NATURE_LABELS = {
    civil: 'Civil Case',
    criminal: 'Criminal Case'
}

function normalizeParty(party) {
    if (!party) return null

    if (typeof party === 'string') {
        const name = party.trim()
        return name ? { id: '', name } : null
    }

    const name = String(
        party.name
        ?? party.residentName
        ?? party.fullName
        ?? [party.firstName, party.lastName].filter(Boolean).join(' ')
        ?? ''
    ).trim()

    if (!name) return null

    const id = party.id ?? party.residentId ?? party.ResidentId ?? ''
    return { id: String(id), name }
}

export function normalizePartyList(value) {
    const list = Array.isArray(value) ? value : value ? [value] : []
    return list.map(normalizeParty).filter(Boolean)
}

export function normalizeBlotterEntry(entry = {}) {
    const caseNature = String(
        entry.caseNature ?? entry.nature ?? entry.natureOfCase ?? ''
    ).trim().toLowerCase()

    return {
        id: entry.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        dateTime: entry.dateTime ?? entry.incidentDateTime ?? entry.createdAt ?? '',
        location: String(entry.location ?? '').trim(),
        caseNature,
        complainants: normalizePartyList(entry.complainants ?? entry.complainant),
        respondents: normalizePartyList(entry.respondents ?? entry.respondent),
        narrative: String(entry.narrative ?? entry.summary ?? '').trim(),
        createdAt: entry.createdAt ?? new Date().toISOString()
    }
}

export function formatCaseNatureLabel(caseNature) {
    if (!caseNature) return 'Unspecified'
    return CASE_NATURE_LABELS[caseNature] ?? caseNature
}

export function formatPartyList(parties) {
    const names = normalizePartyList(parties).map(party => party.name)
    return names.length > 0 ? names.join(', ') : 'Not recorded'
}

export function readBlotterEntries() {
    try {
        const rawEntries = localStorage.getItem(BLOTTER_STORAGE_KEY)
        const entries = rawEntries ? JSON.parse(rawEntries) : []
        if (!Array.isArray(entries)) return []
        return entries.map(normalizeBlotterEntry)
    }
    catch (error) {
        console.error('Failed to read blotter entries.', error)
        return []
    }
}

export function writeBlotterEntries(entries) {
    localStorage.setItem(BLOTTER_STORAGE_KEY, JSON.stringify(entries))
}

export function addBlotterEntry(entry) {
    const entries = readBlotterEntries()
    const nextEntry = normalizeBlotterEntry({
        ...entry,
        createdAt: entry.createdAt ?? new Date().toISOString()
    })

    entries.unshift(nextEntry)
    writeBlotterEntries(entries)
    return nextEntry
}

export function getBlotterEntriesSorted() {
    return readBlotterEntries().sort((left, right) => {
        const leftTime = new Date(left.dateTime ?? left.createdAt ?? 0).getTime()
        const rightTime = new Date(right.dateTime ?? right.createdAt ?? 0).getTime()
        return rightTime - leftTime
    })
}

export function getRecentBlotterEntries(limit = 5) {
    return getBlotterEntriesSorted().slice(0, limit)
}

/** Re-save entries so legacy shapes are upgraded in localStorage. */
export function migrateBlotterEntries() {
    const entries = readBlotterEntries()
    writeBlotterEntries(entries)
}
