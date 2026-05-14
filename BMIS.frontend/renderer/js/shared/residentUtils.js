export const SEX_LABELS = { 0: 'Male', 1: 'Female' }
export const SECTOR_LABELS = { 0: 'General', 1: 'PWD', 2: 'Senior' }
export const CIVIL_STATUS_LABELS = {
    0: 'Single',
    1: 'Married',
    2: 'Widowed',
    3: 'Divorced',
    4: 'Annulled',
    5: 'Legally Separated'
}

export function getResidentId(resident) {
    return resident?.residentId ?? resident?.ResidentId ?? resident?.id
}

export function getResidentFullName(resident, options = {}) {
    const { includeSuffix = true } = options
    const middleInitial = resident?.middleName ? `${resident.middleName[0]}.` : ''
    const suffix = includeSuffix ? resident?.suffix ?? '' : ''

    return `${resident?.lastName ?? ''}, ${resident?.firstName ?? ''} ${middleInitial} ${suffix}`.trim()
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
