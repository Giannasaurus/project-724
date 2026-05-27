import { getResidentId } from '../../shared/residentUtils.js'

const RESIDENT_EXTRAS_KEY = 'bmisResidentExtras'

export function toResidentApiPayload(resident = {}) {
    return {
        firstName: resident.firstName,
        middleName: resident.middleName || null,
        lastName: resident.lastName,
        suffix: resident.suffix || null,
        birthDate: resident.birthDate,
        sex: Number(resident.sex),
        civilStatus: Number(resident.civilStatus),
        address: resident.address,
        phone: resident.phone ?? resident.contact ?? '',
        email: resident.email || null,
        isHead: getResidentIsHead(resident),
        houseHoldId: Number(resident.houseHoldId ?? resident.householdId ?? 0)
    }
}

export function mergeResidentExtras(response) {
    if (!response?.success) return response

    if (Array.isArray(response.data)) {
        return {
            ...response,
            data: response.data.map(mergeResidentExtra)
        }
    }

    if (response.data && typeof response.data === 'object') {
        return {
            ...response,
            data: mergeResidentExtra(response.data)
        }
    }

    return response
}

export function mergeResidentExtra(resident = {}) {
    const extras = getResidentExtras()
    const stored = extras[getResidentStorageKey(resident)] ?? extras[getResidentIdentityStorageKey(resident)] ?? {}
    const merged = {
        ...resident,
        ...stored
    }

    if (!merged.contact && merged.phone) merged.contact = merged.phone
    if (!merged.phone && merged.contact) merged.phone = merged.contact
    if (merged.sector === undefined || merged.sector === null || merged.sector === '') {
        merged.sector = getDerivedSector(merged)
    }
    if (!merged.householdRole && typeof merged.isHead === 'boolean') {
        merged.householdRole = merged.isHead ? 'Head' : ''
    }

    return merged
}

export function saveResidentExtra(resident = {}, source = {}) {
    const key = getResidentStorageKey(resident) || getResidentIdentityStorageKey(source)
    const identityKey = getResidentIdentityStorageKey(source)
    if (!key && !identityKey) return

    const extras = getResidentExtras()
    const extra = {
        sector: source.sector,
        placeOfBirth: source.placeOfBirth,
        civilStatusOther: source.civilStatusOther,
        citizenship: source.citizenship,
        religion: source.religion,
        houseNumberStreet: source.houseNumberStreet,
        purokZone: source.purokZone,
        barangay: source.barangay,
        municipalityCity: source.municipalityCity,
        province: source.province,
        contact: source.contact ?? source.phone,
        email: source.email,
        householdRole: source.householdRole,
        householdHeadName: source.householdHeadName,
        relationshipToHouseholdHead: source.relationshipToHouseholdHead,
        householdMembers: source.householdMembers,
        occupation: source.occupation,
        employerSchool: source.employerSchool,
        highestEducationalAttainment: source.highestEducationalAttainment,
        remarks: source.remarks,
        proofType: source.proofType,
        proofId: source.proofId,
        verificationStatus: source.verificationStatus,
        verifiedBy: source.verifiedBy,
        verifiedAt: source.verifiedAt
    }

    if (key) extras[key] = pruneEmpty(extra)
    if (identityKey) extras[identityKey] = pruneEmpty(extra)
    localStorage.setItem(RESIDENT_EXTRAS_KEY, JSON.stringify(extras))
}

function getResidentIsHead(resident) {
    if (typeof resident.isHead === 'boolean') return resident.isHead
    return resident.householdRole === 'Head'
}

function getDerivedSector(resident) {
    return getResidentAge(resident) >= 60 ? 2 : 0
}

function getResidentAge(resident) {
    if (Number.isFinite(resident.age)) return resident.age

    const birthdate = new Date(resident.birthDate)
    if (Number.isNaN(birthdate.getTime())) return 0

    const today = new Date()
    let age = today.getFullYear() - birthdate.getFullYear()
    const hasBirthdayPassed = (
        today.getMonth() > birthdate.getMonth() ||
        today.getMonth() === birthdate.getMonth() && today.getDate() >= birthdate.getDate()
    )

    return hasBirthdayPassed ? age : age - 1
}

function getResidentExtras() {
    try {
        return JSON.parse(localStorage.getItem(RESIDENT_EXTRAS_KEY) ?? '{}')
    }
    catch {
        return {}
    }
}

function getResidentStorageKey(resident) {
    const id = getResidentId(resident)
    return id ? `id:${id}` : ''
}

function getResidentIdentityStorageKey(resident = {}) {
    const key = [
        resident.lastName,
        resident.firstName,
        resident.middleName,
        resident.suffix,
        resident.birthDate
    ].map(normalizeKey).join('|')

    return key.replace(/\|/g, '') ? `identity:${key}` : ''
}

function pruneEmpty(values) {
    return Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== undefined && value !== null && value !== '')
    )
}

function normalizeKey(value) {
    return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}
