import { getData } from '../../core/api.js'
import { getResidentFullName, getResidentId } from '../../shared/residentUtils.js'

export async function getResidentIntegrityError(values, options = {}) {
    const residents = await getExistingResidents()
    const duplicate = findDuplicateResident(residents, values, options.currentResident)
    if (duplicate) {
        return `Possible duplicate resident found: ${getResidentFullName(duplicate)}. Review the existing record before saving.`
    }

    const householdError = getHouseholdIntegrityError(residents, values, options.currentResident)
    if (householdError) return householdError

    return ''
}

async function getExistingResidents() {
    const result = await getData('/residents')
    return result?.success && Array.isArray(result.data) ? result.data : []
}

function findDuplicateResident(residents, values, currentResident) {
    const currentResidentId = getResidentId(currentResident)
    const candidateKey = getResidentIdentityKey(values)

    return residents.find((resident) => (
        getResidentId(resident) !== currentResidentId &&
        getResidentIdentityKey(resident) === candidateKey
    ))
}

function getHouseholdIntegrityError(residents, values, currentResident) {
    if (values.householdRole !== 'Member') return ''

    const selectedHeadName = normalizeKey(values.householdHeadName)
    if (getResidentNameAliases(values).includes(selectedHeadName)) {
        return 'A household member cannot use their own name as the household head.'
    }

    const currentResidentId = getResidentId(currentResident)
    const householdHead = residents.find((resident) => (
        getResidentId(resident) !== currentResidentId &&
        resident.householdRole !== 'Member' &&
        getResidentNameAliases(resident).includes(selectedHeadName)
    ))

    if (!householdHead) {
        return 'Household members must select an existing household head from resident records.'
    }

    return ''
}

function getResidentIdentityKey(resident) {
    return [
        resident.lastName,
        resident.firstName,
        resident.middleName,
        resident.suffix,
        resident.birthDate ?? getFormBirthDate(resident)
    ].map(normalizeKey).join('|')
}

function getResidentNameAliases(resident) {
    const fullName = getResidentFullName(resident)
    const straightName = [
        resident.firstName,
        resident.middleName,
        resident.lastName,
        resident.suffix
    ].filter(Boolean).join(' ')

    return [fullName, straightName].map(normalizeKey).filter(Boolean)
}

function getFormBirthDate(values) {
    if (!values.year || !values.month || !values.day) return ''
    return `${values.year}-${String(values.month).padStart(2, '0')}-${String(values.day).padStart(2, '0')}`
}

function normalizeKey(value) {
    return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}
