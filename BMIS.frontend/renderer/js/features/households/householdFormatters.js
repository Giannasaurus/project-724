export {
    getCivilStatusLabel,
    getResidentFullName,
    getResidentId,
    getSectorLabel,
    getSexLabel
} from '../../shared/residentUtils.js'

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
