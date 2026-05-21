import { getResidentFullName, getResidentId } from '../../shared/residentUtils.js'

export function getHouseholdsFromResidents(residents) {
    const householdMap = new Map()
    const assignedResidentIds = new Set()

    residents
        .filter(resident => resident.householdRole === 'Head')
        .forEach((head) => {
            const household = createHeadHousehold(head, residents)
            householdMap.set(household.id, household)
            household.memberIds.forEach(id => assignedResidentIds.add(id))
        })

    residents
        .filter(resident => resident.householdRole === 'Member' && !assignedResidentIds.has(getResidentId(resident)))
        .forEach((member) => {
            const key = getHeadNameKey(member.householdHeadName)
            if (!key) return

            const id = `head-name-${key}`
            const household = householdMap.get(id) ?? createNamedHeadHousehold(id, member.householdHeadName, member.address)
            household.members.push(member)
            household.memberIds.push(getResidentId(member))
            householdMap.set(id, household)
            assignedResidentIds.add(getResidentId(member))
        })

    residents
        .filter(resident => !assignedResidentIds.has(getResidentId(resident)))
        .forEach((resident) => {
            const address = resident.address?.trim()
            if (!address) return

            const id = `address-${address.toLowerCase()}`
            const household = householdMap.get(id) ?? createAddressHousehold(id, resident)
            household.members.push(resident)
            household.memberIds.push(getResidentId(resident))
            householdMap.set(id, household)
            assignedResidentIds.add(getResidentId(resident))
        })

    return Array.from(householdMap.values())
        .map(household => ({
            ...household,
            memberCount: household.memberIds.length
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
}

export function getHouseholdMemberLabel(member) {
    const relationship = member.relationshipToHouseholdHead?.trim()
    return relationship ? `${getResidentFullName(member)} - ${relationship}` : getResidentFullName(member)
}

function createHeadHousehold(head, residents) {
    const headName = getResidentFullName(head)
    const members = residents.filter(resident => (
        getResidentId(resident) === getResidentId(head) ||
        (
            resident.householdRole === 'Member' &&
            getHeadNameKey(resident.householdHeadName) === getHeadNameKey(headName)
        )
    ))

    return {
        id: `head-${getResidentId(head)}`,
        source: 'resident',
        name: `${head.lastName || 'Household'} Household`,
        head: headName,
        address: head.address,
        members,
        memberIds: members.map(getResidentId)
    }
}

function createNamedHeadHousehold(id, headName, address) {
    return {
        id,
        source: 'resident',
        name: `${headName || 'Unlinked'} Household`,
        head: headName || 'Not specified',
        address: address || 'No address recorded',
        members: [],
        memberIds: []
    }
}

function createAddressHousehold(id, resident) {
    const address = resident.address?.trim() || 'No address recorded'

    return {
        id,
        source: 'resident',
        name: getAddressHouseholdName(resident, address),
        head: resident.householdRole === 'Head' ? getResidentFullName(resident) : 'Not specified',
        address,
        members: [],
        memberIds: []
    }
}

function getAddressHouseholdName(resident, address) {
    const houseNumber = address.match(/^\s*([A-Za-z0-9-]+)/)?.[1]
    return `${houseNumber || 'Address'}-${resident.lastName || 'Household'}`
}

function getHeadNameKey(value) {
    return String(value ?? '').trim().toLowerCase()
}
