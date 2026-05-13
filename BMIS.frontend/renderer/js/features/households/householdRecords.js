import { getResidentFullName, getResidentId, sortByName } from './householdFormatters.js'

export function getMergedHouseholds(residents, manualHouseholds) {
    return mergeHouseholds(getResidentHouseholds(residents), manualHouseholds)
}

export function getResidentHouseholds(residentList) {
    const groups = new Map()

    residentList.forEach((resident) => {
        const address = resident.address?.trim()
        if (!address) return

        const key = address.toLowerCase()
        const group = groups.get(key) ?? createDerivedHousehold(key, resident, address)

        group.memberCount += 1
        groups.set(key, group)
    })

    return Array.from(groups.values()).sort(sortByName)
}

export function mergeHouseholds(derivedHouseholds, manualHouseholds) {
    const householdMap = new Map()

    derivedHouseholds.forEach((household) => {
        householdMap.set(household.address.toLowerCase(), household)
    })

    manualHouseholds.forEach((household) => {
        const key = household.address.toLowerCase()
        const existing = householdMap.get(key)

        householdMap.set(key, {
            ...existing,
            ...household,
            memberCount: household.memberIds?.length ?? existing?.memberCount ?? 0,
            source: existing ? 'resident+manual' : 'manual'
        })
    })

    return Array.from(householdMap.values()).sort(sortByName)
}

export function getUpdatedManualHouseholds({ manualHouseholds, household, editingHousehold }) {
    const previousAddress = editingHousehold?.address?.toLowerCase()
    const previousId = editingHousehold?.id

    return [
        ...manualHouseholds.filter((item) => (
            item.id !== previousId &&
            item.address.toLowerCase() !== household.address.toLowerCase() &&
            item.address.toLowerCase() !== previousAddress
        )),
        household
    ]
}

export function getHouseholdFormValues({ selectedResidents, headId, name, editingHousehold }) {
    const headResident = selectedResidents.find(resident => getResidentId(resident) === headId)
    const firstResident = selectedResidents[0]

    return {
        id: editingHousehold?.source?.includes('manual') ? editingHousehold.id : `manual-${Date.now()}`,
        source: 'manual',
        name,
        head: headResident ? getResidentFullName(headResident) : '',
        headId,
        address: firstResident?.address?.trim() || name,
        memberIds: selectedResidents.map(getResidentId),
        memberCount: selectedResidents.length
    }
}

export function getHouseholdValidationError(household) {
    if (!household.name) return 'Household name is required.'
    if (household.memberIds.length === 0) return 'Select at least one household member.'
    if (!household.headId) return 'Select a household head.'

    return ''
}

export function canDeleteHousehold(household) {
    return household.source?.includes('manual')
}

export function getHouseholdRecordType(household) {
    return canDeleteHousehold(household) ? 'Manual record' : 'Resident address group'
}

export function getHouseholdMembers(household, residents) {
    const memberIds = getHouseholdMemberIds(household, residents)
    return residents.filter(resident => memberIds.includes(getResidentId(resident)))
}

export function getHouseholdMemberIds(household, residents) {
    if (Array.isArray(household.memberIds) && household.memberIds.length > 0) {
        return household.memberIds
    }

    return residents
        .filter(resident => resident.address?.trim().toLowerCase() === household.address?.trim().toLowerCase())
        .map(getResidentId)
}

export function getHouseholdHeadId(household, residents) {
    if (household.headId) return household.headId

    const headResident = getHouseholdMembers(household, residents).find(resident => getResidentFullName(resident) === household.head)
    return headResident ? getResidentId(headResident) : ''
}

function createDerivedHousehold(key, resident, address) {
    return {
        id: `derived-${key}`,
        source: 'resident',
        name: getHouseholdName(resident),
        head: getResidentFullName(resident),
        address,
        memberCount: 0
    }
}

function getHouseholdName(resident) {
    const houseNumber = resident.address?.match(/^\s*([A-Za-z0-9-]+)/)?.[1]
    const namePrefix = houseNumber || 'Household'

    return `${namePrefix}-${resident.lastName}`
}
