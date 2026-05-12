import { getData } from '../../core/api.js'

const HOUSEHOLDS_STORAGE_KEY = 'bmisHouseholds'

let households = []
let residents = []
let selectedMemberIds = new Set()

export async function initHouseholdsPage() {
    bindHouseholdControls()
    await loadHouseholdData()
}

function bindHouseholdControls() {
    document.getElementById('householdSearch')?.addEventListener('input', renderHouseholds)
    document.getElementById('addHouseholdBtn')?.addEventListener('click', showAddHouseholdView)
    document.getElementById('householdBackBtn')?.addEventListener('click', showHouseholdsListView)
    document.getElementById('householdCancelBtn')?.addEventListener('click', showHouseholdsListView)
    document.getElementById('householdMemberSearch')?.addEventListener('input', renderMemberRows)
    document.getElementById('householdForm')?.addEventListener('submit', handleHouseholdSubmit)
}

async function loadHouseholdData() {
    residents = await getResidents()
    households = mergeHouseholds(getResidentHouseholds(residents), readManualHouseholds())
    renderHouseholds()
}

async function getResidents() {
    const result = await getData('/residents')
    if (!result?.success || !Array.isArray(result.data)) return []

    return result.data
}

function getResidentHouseholds(residentList) {
    const groups = new Map()

    residentList.forEach((resident) => {
        const address = resident.address?.trim()
        if (!address) return

        const key = address.toLowerCase()
        const group = groups.get(key) ?? {
            id: `derived-${key}`,
            source: 'resident',
            name: getHouseholdName(resident),
            head: getResidentFullName(resident),
            address,
            memberCount: 0
        }

        group.memberCount += 1
        groups.set(key, group)
    })

    return Array.from(groups.values()).sort(sortByName)
}

function mergeHouseholds(derivedHouseholds, manualHouseholds) {
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

function renderHouseholds() {
    const list = document.getElementById('householdsList')
    if (!list) return

    const filteredHouseholds = getFilteredHouseholds()
    list.innerHTML = ''

    if (filteredHouseholds.length === 0) {
        list.innerHTML = '<p class="households-empty">No households found.</p>'
        return
    }

    filteredHouseholds.forEach((household) => {
        list.appendChild(createHouseholdRow(household))
    })
}

function getFilteredHouseholds() {
    const query = document.getElementById('householdSearch')?.value.trim().toLowerCase() ?? ''

    if (!query) return households

    return households.filter((household) => (
        household.name.toLowerCase().includes(query) ||
        household.address.toLowerCase().includes(query) ||
        household.head.toLowerCase().includes(query)
    ))
}

function createHouseholdRow(household) {
    const row = document.createElement('button')
    const householdInfo = document.createElement('span')
    const name = document.createElement('strong')
    const address = document.createElement('small')
    const head = document.createElement('span')
    const members = document.createElement('span')

    row.className = 'household-row'
    row.type = 'button'

    name.textContent = household.name
    address.textContent = household.address
    householdInfo.className = 'household-row-main'
    householdInfo.append(name, address)

    head.textContent = household.head || 'Not specified'
    members.textContent = `${household.memberCount} ${household.memberCount === 1 ? 'member' : 'members'}`

    row.append(householdInfo, head, members)
    return row
}

function showAddHouseholdView() {
    selectedMemberIds = new Set()
    document.getElementById('householdForm')?.reset()
    setText('householdFormError', '')
    showSubview('add')
    renderMemberRows()
    renderHeadOptions()
}

function showHouseholdsListView() {
    showSubview('list')
    renderHouseholds()
}

function showSubview(view) {
    const listView = document.getElementById('householdsListView')
    const addView = document.getElementById('addHouseholdView')

    if (listView) listView.hidden = view !== 'list'
    if (addView) addView.hidden = view !== 'add'
}

function renderMemberRows() {
    const tableBody = document.getElementById('householdMembersBody')
    if (!tableBody) return

    const filteredResidents = getFilteredResidents()
    tableBody.innerHTML = ''

    if (filteredResidents.length === 0) {
        const row = document.createElement('tr')
        const cell = document.createElement('td')
        cell.className = 'household-members-empty'
        cell.colSpan = 5
        cell.textContent = 'No residents found.'
        row.appendChild(cell)
        tableBody.appendChild(row)
        return
    }

    filteredResidents.forEach((resident) => {
        tableBody.appendChild(createMemberRow(resident))
    })
}

function getFilteredResidents() {
    const query = document.getElementById('householdMemberSearch')?.value.trim().toLowerCase() ?? ''

    if (!query) return residents

    return residents.filter((resident) => (
        getResidentFullName(resident).toLowerCase().includes(query) ||
        resident.address?.toLowerCase().includes(query)
    ))
}

function createMemberRow(resident) {
    const row = document.createElement('tr')
    const residentId = getResidentId(resident)
    const isSelected = selectedMemberIds.has(residentId)
    const cells = [
        createMemberNameCell(resident, residentId, isSelected),
        resident.birthDate,
        getSexLabel(resident.sex),
        getCivilStatusLabel(resident.civilStatus),
        getSectorLabel(resident.sector)
    ]

    cells.forEach((cell) => {
        const td = document.createElement('td')
        if (cell instanceof Node) {
            td.appendChild(cell)
        }
        else {
            td.textContent = cell
        }
        row.appendChild(td)
    })

    return row
}

function createMemberNameCell(resident, residentId, isSelected) {
    const label = document.createElement('label')
    const checkbox = document.createElement('input')
    const name = document.createElement('span')

    label.className = 'household-member-check'
    checkbox.type = 'checkbox'
    checkbox.checked = isSelected
    checkbox.addEventListener('change', () => {
        toggleSelectedMember(residentId, checkbox.checked)
    })
    name.textContent = getResidentFullName(resident)

    label.append(checkbox, name)
    return label
}

function toggleSelectedMember(residentId, isSelected) {
    if (isSelected) {
        selectedMemberIds.add(residentId)
    }
    else {
        selectedMemberIds.delete(residentId)
    }

    renderHeadOptions()
}

function renderHeadOptions() {
    const select = document.getElementById('householdHeadSelect')
    if (!select) return

    const previousValue = select.value
    const selectedResidents = getSelectedResidents()

    select.innerHTML = '<option value="">Select household head</option>'
    selectedResidents.forEach((resident) => {
        const option = document.createElement('option')
        option.value = String(getResidentId(resident))
        option.textContent = getResidentFullName(resident)
        select.appendChild(option)
    })

    if (selectedMemberIds.has(Number(previousValue))) {
        select.value = previousValue
    }
}

function handleHouseholdSubmit(event) {
    event.preventDefault()

    const household = getHouseholdFormValues()
    const validationError = getHouseholdValidationError(household)

    if (validationError) {
        setText('householdFormError', validationError)
        return
    }

    const manualHouseholds = readManualHouseholds()
    const updatedHouseholds = [
        ...manualHouseholds.filter(item => item.address.toLowerCase() !== household.address.toLowerCase()),
        household
    ]

    writeManualHouseholds(updatedHouseholds)
    households = mergeHouseholds(getResidentHouseholds(residents), updatedHouseholds)
    showHouseholdsListView()
}

function getHouseholdFormValues() {
    const selectedResidents = getSelectedResidents()
    const headId = Number(document.getElementById('householdHeadSelect')?.value)
    const headResident = selectedResidents.find(resident => getResidentId(resident) === headId)
    const firstResident = selectedResidents[0]
    const name = document.getElementById('householdNameInput')?.value.trim() ?? ''

    return {
        id: `manual-${Date.now()}`,
        source: 'manual',
        name,
        head: headResident ? getResidentFullName(headResident) : '',
        headId,
        address: firstResident?.address?.trim() || name,
        memberIds: selectedResidents.map(getResidentId),
        memberCount: selectedResidents.length
    }
}

function getHouseholdValidationError(household) {
    if (!household.name) return 'Household name is required.'
    if (household.memberIds.length === 0) return 'Select at least one household member.'
    if (!household.headId) return 'Select a household head.'

    return ''
}

function getSelectedResidents() {
    return residents.filter(resident => selectedMemberIds.has(getResidentId(resident)))
}

function readManualHouseholds() {
    try {
        const rawHouseholds = localStorage.getItem(HOUSEHOLDS_STORAGE_KEY)
        return rawHouseholds ? JSON.parse(rawHouseholds) : []
    }
    catch (error) {
        console.error('Failed to read households.', error)
        return []
    }
}

function writeManualHouseholds(householdsToSave) {
    localStorage.setItem(HOUSEHOLDS_STORAGE_KEY, JSON.stringify(householdsToSave))
}

function setText(id, value) {
    const element = document.getElementById(id)
    if (element) element.textContent = value
}

function getHouseholdName(resident) {
    const houseNumber = resident.address?.match(/^\s*([A-Za-z0-9-]+)/)?.[1]
    const namePrefix = houseNumber || 'Household'

    return `${namePrefix}-${resident.lastName}`
}

function getResidentFullName(resident) {
    const middleInitial = resident.middleName ? `${resident.middleName[0]}.` : ''
    return `${resident.lastName}, ${resident.firstName} ${middleInitial} ${resident.suffix ?? ''}`.trim()
}

function getResidentId(resident) {
    return resident.residentId ?? resident.ResidentId ?? resident.id
}

function sortByName(a, b) {
    return a.name.localeCompare(b.name)
}

function getSexLabel(sex) {
    return ({ 0: 'Male', 1: 'Female' })[sex] ?? 'Unknown'
}

function getSectorLabel(sector) {
    return ({ 0: 'General', 1: 'Senior', 2: 'PWD' })[sector] ?? 'Unknown'
}

function getCivilStatusLabel(civilStatus) {
    return ({
        0: 'Single',
        1: 'Married',
        2: 'Widowed',
        3: 'Divorced',
        4: 'Annulled',
        5: 'Legally Separated'
    })[civilStatus] ?? 'Unknown'
}
