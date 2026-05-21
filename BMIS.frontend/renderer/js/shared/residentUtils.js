export const SEX_LABELS = { 0: 'Male', 1: 'Female' }
export const SECTOR_LABELS = { 0: 'General', 1: 'PWD', 2: 'Senior' }
export const CIVIL_STATUS_LABELS = {
    0: 'Single',
    1: 'Married',
    2: 'Widowed',
    3: 'Divorced',
    4: 'Annulled',
    5: 'Separated',
    6: 'Other'
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

export function sanitizeResidentPayload(resident) {
    return {
        ...resident,
        firstName: toNameCase(resident.firstName),
        middleName: toNameCase(resident.middleName),
        lastName: toNameCase(resident.lastName),
        suffix: normalizeSuffix(resident.suffix),
        placeOfBirth: toNameCase(resident.placeOfBirth),
        civilStatusOther: toNameCase(resident.civilStatusOther),
        citizenship: toNameCase(resident.citizenship),
        religion: toNameCase(resident.religion),
        address: normalizeSpacing(resident.address),
        houseNumberStreet: normalizeSpacing(resident.houseNumberStreet),
        purokZone: normalizeSpacing(resident.purokZone),
        barangay: toNameCase(resident.barangay),
        municipalityCity: toNameCase(resident.municipalityCity),
        province: toNameCase(resident.province),
        contact: normalizeSpacing(resident.contact),
        email: normalizeEmail(resident.email),
        householdHeadName: toNameCase(resident.householdHeadName),
        relationshipToHouseholdHead: toNameCase(resident.relationshipToHouseholdHead),
        householdMembers: normalizeHouseholdMembers(resident.householdMembers),
        occupation: toNameCase(resident.occupation),
        employerSchool: toNameCase(resident.employerSchool),
        highestEducationalAttainment: toNameCase(resident.highestEducationalAttainment),
        remarks: normalizeSpacing(resident.remarks),
        proofId: normalizeSpacing(resident.proofId)
    }
}

export function compareResidentsByName(left, right) {
    return getResidentSortName(left).localeCompare(getResidentSortName(right), undefined, {
        sensitivity: 'base',
        numeric: true
    })
}

function getResidentSortName(resident) {
    return [
        resident?.lastName,
        resident?.firstName,
        resident?.middleName,
        resident?.suffix
    ].map(normalizeSpacing).join(' ')
}

function toNameCase(value) {
    return normalizeSpacing(value)
        .toLowerCase()
        .replace(/\b([a-z])/g, match => match.toUpperCase())
        .replace(/\b(Mc)([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`)
}

function normalizeSuffix(value) {
    const suffix = normalizeSpacing(value)
    const romanSuffix = suffix.toUpperCase()

    if (['JR', 'SR'].includes(romanSuffix)) return `${titleCase(suffix)}.`
    if (/^(I|II|III|IV|V|VI|VII|VIII|IX|X)$/.test(romanSuffix)) return romanSuffix

    return suffix
}

function normalizeHouseholdMembers(value) {
    return normalizeSpacing(value)
        .split(';')
        .map(toNameCase)
        .filter(Boolean)
        .join('; ')
}

function normalizeEmail(value) {
    return normalizeSpacing(value).toLowerCase()
}

function normalizeSpacing(value) {
    return String(value ?? '').trim().replace(/\s+/g, ' ')
}

function titleCase(value) {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}
