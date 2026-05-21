import { getData } from '../../core/api.js'
import { getResidentQueryParams, searchResidentsByName } from './residentSearch.js'

const SEX_FILTER_VALUES = { Male: 0, Female: 1 }
const SECTOR_FILTER_VALUES = { General: 0, PWD: 1, Senior: 2 }
const CIVIL_STATUS_FILTER_VALUES = {
    Single: 0,
    Married: 1,
    Widowed: 2,
    Divorced: 3,
    Anulled: 4,
    LegallySeparated: 5
}

export function hasActiveResidentFilters(filters = {}) {
    return Boolean(
        filters.minAge !== undefined && filters.minAge !== '' ||
        filters.maxAge !== undefined && filters.maxAge !== '' ||
        filters.order ||
        filters.sex?.length ||
        filters.sector?.length ||
        filters.civilStat?.length ||
        filters.householdRole?.length ||
        filters.contactStatus?.length ||
        filters.verificationStatus?.length
    )
}

export async function getFilteredResidentPageData(query, filters, from, limit) {
    const result = query
        ? await searchResidentsByName(query, { from: 0, limit: 10000, filters })
        : await getData(`/residents/filter?${getResidentQueryParams({ filters }).toString()}`)

    if (!result.success || !Array.isArray(result.data)) return result

    const filteredData = filterResidentData(result.data, filters)
    return {
        ...result,
        data: filteredData.slice(from, from + limit),
        filteredData
    }
}

function filterResidentData(residents, filters = {}) {
    const filtered = residents.filter(resident => {
        const age = getResidentAge(resident)
        const minAge = getOptionalNumber(filters.minAge)
        const maxAge = getOptionalNumber(filters.maxAge)

        if (minAge !== null && age < minAge) return false
        if (maxAge !== null && age > maxAge) return false
        if (!matchesEnumFilter(resident.sex, filters.sex, SEX_FILTER_VALUES)) return false
        if (!matchesEnumFilter(resident.sector, filters.sector, SECTOR_FILTER_VALUES)) return false
        if (!matchesEnumFilter(resident.civilStatus, filters.civilStat, CIVIL_STATUS_FILTER_VALUES)) return false
        if (!matchesHouseholdRoleFilter(resident, filters.householdRole)) return false
        if (!matchesContactStatusFilter(resident, filters.contactStatus)) return false
        if (!matchesVerificationStatusFilter(resident, filters.verificationStatus)) return false

        return true
    })

    return sortResidents(filtered, filters.order)
}

function matchesHouseholdRoleFilter(resident, selectedValues = []) {
    if (!Array.isArray(selectedValues) || selectedValues.length === 0) return true

    const role = resident.householdRole || 'NotRecorded'
    return selectedValues.includes(role)
}

function matchesContactStatusFilter(resident, selectedValues = []) {
    if (!Array.isArray(selectedValues) || selectedValues.length === 0) return true

    const hasContact = Boolean(resident.contact?.trim() || resident.email?.trim())
    return (
        hasContact && selectedValues.includes('WithContact') ||
        !hasContact && selectedValues.includes('MissingContact')
    )
}

function matchesVerificationStatusFilter(resident, selectedValues = []) {
    if (!Array.isArray(selectedValues) || selectedValues.length === 0) return true

    const status = resident.verificationStatus || 'NotRecorded'
    return selectedValues.includes(status)
}

function matchesEnumFilter(value, selectedValues = [], valueMap) {
    if (!Array.isArray(selectedValues) || selectedValues.length === 0) return true

    return selectedValues.some(selectedValue => valueMap[selectedValue] === value)
}

function sortResidents(residents, order) {
    const sorted = [...residents]

    switch (order) {
        case 'ByFirstName':
            return sorted.sort((a, b) => compareText(a.firstName, b.firstName))
        case 'ByFirstNameDesc':
            return sorted.sort((a, b) => compareText(b.firstName, a.firstName))
        case 'ByLastName':
            return sorted.sort((a, b) => compareText(a.lastName, b.lastName))
        case 'ByLastNameDesc':
            return sorted.sort((a, b) => compareText(b.lastName, a.lastName))
        case 'ByAge':
            return sorted.sort((a, b) => getResidentAge(a) - getResidentAge(b))
        case 'ByAgeDesc':
            return sorted.sort((a, b) => getResidentAge(b) - getResidentAge(a))
        default:
            return sorted
    }
}

function compareText(a, b) {
    return String(a ?? '').localeCompare(String(b ?? ''), undefined, { sensitivity: 'base' })
}

function getOptionalNumber(value) {
    if (value === undefined || value === null || value === '') return null
    return Number(value)
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
