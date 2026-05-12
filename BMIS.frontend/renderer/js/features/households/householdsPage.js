import { getData } from '../../core/api.js'

const HOUSEHOLDS_STORAGE_KEY = 'bmisHouseholds'

let households = []

export async function initHouseholdsPage() {
    bindHouseholdControls()
    await loadHouseholds()
}

function bindHouseholdControls() {
    const searchInput = document.getElementById('householdSearch')
    const addBtn = document.getElementById('addHouseholdBtn')
    const dialog = document.getElementById('householdDialog')
    const closeBtn = document.getElementById('householdDialogCloseBtn')
    const cancelBtn = document.getElementById('householdCancelBtn')
    const form = document.getElementById('householdForm')

    searchInput?.addEventListener('input', renderHouseholds)
    addBtn?.addEventListener('click', openHouseholdDialog)
    closeBtn?.addEventListener('click', closeHouseholdDialog)
    cancelBtn?.addEventListener('click', closeHouseholdDialog)
    dialog?.addEventListener('click', closeDialogOnBackdrop)
    form?.addEventListener('submit', handleHouseholdSubmit)
}

async function loadHouseholds() {
    const derivedHouseholds = await getResidentHouseholds()
    households = mergeHouseholds(derivedHouseholds, readManualHouseholds())
    renderHouseholds()
}

async function getResidentHouseholds() {
    const result = await getData('/residents')
    if (!result?.success || !Array.isArray(result.data)) return []

    const groups = new Map()

    result.data.forEach((resident) => {
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

    return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name))
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
            memberCount: existing?.memberCount ?? household.memberCount ?? 0,
            source: existing ? 'resident+manual' : 'manual'
        })
    })

    return Array.from(householdMap.values()).sort((a, b) => a.name.localeCompare(b.name))
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
    const searchInput = document.getElementById('householdSearch')
    const query = searchInput?.value.trim().toLowerCase() ?? ''

    if (!query) return households

    return households.filter((household) => {
        return (
            household.name.toLowerCase().includes(query) ||
            household.address.toLowerCase().includes(query) ||
            household.head.toLowerCase().includes(query)
        )
    })
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

function openHouseholdDialog() {
    const dialog = document.getElementById('householdDialog')
    const form = document.getElementById('householdForm')
    const error = document.getElementById('householdFormError')

    form?.reset()
    if (error) error.textContent = ''
    dialog?.showModal()
}

function closeHouseholdDialog() {
    const dialog = document.getElementById('householdDialog')
    dialog?.close()
}

function closeDialogOnBackdrop(event) {
    const dialog = event.currentTarget
    const rect = dialog.getBoundingClientRect()
    const clickedInDialog = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
    )

    if (!clickedInDialog) dialog.close()
}

function handleHouseholdSubmit(event) {
    event.preventDefault()

    const error = document.getElementById('householdFormError')
    const household = getHouseholdFormValues()

    if (!household.name || !household.address) {
        if (error) error.textContent = 'Household name and address are required.'
        return
    }

    const manualHouseholds = readManualHouseholds()
    const updatedHouseholds = [
        ...manualHouseholds.filter(item => item.id !== household.id && item.address.toLowerCase() !== household.address.toLowerCase()),
        household
    ]

    writeManualHouseholds(updatedHouseholds)
    households = mergeHouseholds(households.filter(item => item.source !== 'manual'), updatedHouseholds)
    renderHouseholds()
    closeHouseholdDialog()
}

function getHouseholdFormValues() {
    const name = document.getElementById('householdNameInput')?.value.trim() ?? ''
    const head = document.getElementById('householdHeadInput')?.value.trim() ?? ''
    const address = document.getElementById('householdAddressInput')?.value.trim() ?? ''

    return {
        id: `manual-${Date.now()}`,
        source: 'manual',
        name,
        head,
        address,
        memberCount: 0
    }
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

function getHouseholdName(resident) {
    const houseNumber = resident.address?.match(/^\s*([A-Za-z0-9-]+)/)?.[1]
    const namePrefix = houseNumber || 'Household'

    return `${namePrefix}-${resident.lastName}`
}

function getResidentFullName(resident) {
    const middleInitial = resident.middleName ? `${resident.middleName[0]}.` : ''
    return `${resident.lastName}, ${resident.firstName} ${middleInitial} ${resident.suffix ?? ''}`.trim()
}
