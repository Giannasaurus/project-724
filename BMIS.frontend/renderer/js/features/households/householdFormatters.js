import { CIVIL_STATUS_LABELS, SECTOR_LABELS, SEX_LABELS } from './householdConstants.js'

export function getResidentFullName(resident) {
    const middleInitial = resident.middleName ? `${resident.middleName[0]}.` : ''
    return `${resident.lastName}, ${resident.firstName} ${middleInitial} ${resident.suffix ?? ''}`.trim()
}

export function getResidentId(resident) {
    return resident.residentId ?? resident.ResidentId ?? resident.id
}

export function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[char])
}

export function sortByName(a, b) {
    return a.name.localeCompare(b.name)
}

export function getMemberCountLabel(memberCount) {
    return `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`
}

export function getSexLabel(sex) {
    return SEX_LABELS[sex] ?? 'Unknown'
}

export function getSectorLabel(sector) {
    return SECTOR_LABELS[sector] ?? 'Unknown'
}

export function getCivilStatusLabel(civilStatus) {
    return CIVIL_STATUS_LABELS[civilStatus] ?? 'Unknown'
}
