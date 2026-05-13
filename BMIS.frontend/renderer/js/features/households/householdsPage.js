import { getData } from '../../core/api.js'

const HOUSEHOLDS_STORAGE_KEY = 'bmisHouseholds'
const SUBVIEWS = {
    LIST: 'list',
    FORM: 'add',
    DETAILS: 'details'
}

const SEX_LABELS = { 0: 'Male', 1: 'Female' }
const SECTOR_LABELS = { 0: 'General', 1: 'Senior', 2: 'PWD' }
const CIVIL_STATUS_LABELS = {
    0: 'Single',
    1: 'Married',
    2: 'Widowed',
    3: 'Divorced',
    4: 'Annulled',
    5: 'Legally Separated'
}

const pageState = {
    households: [],
    residents: [],
    selectedMemberIds: new Set(),
    editingHousehold: null,
    selectedHousehold: null
}

let elements = {}

export async function initHouseholdsPage() {
    elements = getHouseholdElements()
    bindHouseholdControls()
    await loadHouseholdData()
}

function getHouseholdElements() {
    return {
        actionBar: document.getElementById('householdActionBar'),
        addBtn: document.getElementById('addHouseholdBtn'),
        addView: document.getElementById('addHouseholdView'),
        backBtn: document.getElementById('householdBackBtn'),
        cancelBtn: document.getElementById('householdCancelBtn'),
        deleteCancelBtn: document.getElementById('householdDeleteCancelBtn'),
        deleteCloseBtn: document.getElementById('householdDeleteCloseBtn'),
        deleteConfirmBtn: document.getElementById('householdDeleteConfirmBtn'),
        deleteCopy: document.getElementById('householdDeleteCopy'),
        deleteDialog: document.getElementById('householdDeleteDialog'),
        deleteError: document.getElementById('householdDeleteError'),
        detailsBackBtn: document.getElementById('householdDetailsBackBtn'),
        detailsContent: document.getElementById('householdDetailsContent'),
        detailsView: document.getElementById('householdDetailsView'),
        form: document.getElementById('householdForm'),
        formError: document.getElementById('householdFormError'),
        formTitle: document.getElementById('householdFormTitle'),
        headSelect: document.getElementById('householdHeadSelect'),
        list: document.getElementById('householdsList'),
        listView: document.getElementById('householdsListView'),
        memberSearch: document.getElementById('householdMemberSearch'),
        membersBody: document.getElementById('householdMembersBody'),
        nameInput: document.getElementById('householdNameInput'),
        searchInput: document.getElementById('householdSearch')
    }
}

function bindHouseholdControls() {
    elements.searchInput?.addEventListener('input', renderHouseholds)
    elements.addBtn?.addEventListener('click', showAddHouseholdView)
    elements.backBtn?.addEventListener('click', showHouseholdsListView)
    elements.detailsBackBtn?.addEventListener('click', showHouseholdsListView)
    elements.cancelBtn?.addEventListener('click', showHouseholdsListView)
    elements.memberSearch?.addEventListener('input', renderMemberRows)
    elements.form?.addEventListener('submit', handleHouseholdSubmit)
}

async function loadHouseholdData() {
    pageState.residents = await getResidents()
    pageState.households = getMergedHouseholds(readManualHouseholds())
    renderHouseholds()
}

async function getResidents() {
    const result = await getData('/residents')
    if (!result?.success || !Array.isArray(result.data)) return []

    return result.data
}

function getMergedHouseholds(manualHouseholds) {
    return mergeHouseholds(getResidentHouseholds(pageState.residents), manualHouseholds)
}

function getResidentHouseholds(residentList) {
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
    if (!elements.list) return

    const filteredHouseholds = getFilteredHouseholds()
    clearElement(elements.list)
    pageState.selectedHousehold = null
    renderHouseholdActionBar()

    if (filteredHouseholds.length === 0) {
        elements.list.appendChild(createEmptyMessage('No households found.', 'households-empty'))
        return
    }

    filteredHouseholds.forEach((household) => {
        elements.list.appendChild(createHouseholdRow(household))
    })
}

function getFilteredHouseholds() {
    const query = elements.searchInput?.value.trim().toLowerCase() ?? ''

    if (!query) return pageState.households

    return pageState.households.filter((household) => (
        household.name.toLowerCase().includes(query) ||
        household.address.toLowerCase().includes(query) ||
        household.head.toLowerCase().includes(query)
    ))
}

function createHouseholdRow(household) {
    const row = document.createElement('div')
    const householdInfo = document.createElement('span')
    const name = document.createElement('strong')
    const address = document.createElement('small')
    const head = document.createElement('span')
    const members = document.createElement('span')

    row.className = 'household-row'
    row.tabIndex = 0
    row.addEventListener('click', () => selectHouseholdRow(row, household))
    row.addEventListener('keydown', (event) => handleHouseholdRowKeydown(event, row, household))

    name.textContent = household.name
    address.textContent = household.address
    householdInfo.className = 'household-row-main'
    householdInfo.append(name, address)

    head.textContent = household.head || 'Not specified'
    members.textContent = getMemberCountLabel(household.memberCount)

    row.append(householdInfo, head, members)
    return row
}

function handleHouseholdRowKeydown(event, row, household) {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    selectHouseholdRow(row, household)
}

function selectHouseholdRow(row, household) {
    pageState.selectedHousehold = household
    document.querySelectorAll('.household-row.is-selected').forEach(item => item.classList.remove('is-selected'))
    row.classList.add('is-selected')
    renderHouseholdActionBar()
}

function renderHouseholdActionBar() {
    if (!elements.actionBar) return

    clearElement(elements.actionBar)
    elements.actionBar.hidden = !pageState.selectedHousehold
    if (!pageState.selectedHousehold) return

    const label = document.createElement('span')
    label.className = 'entity-selection-label'
    label.textContent = `Selected household: ${pageState.selectedHousehold.name}`

    const actions = document.createElement('div')
    actions.className = 'entity-row-actions'
    actions.append(
        createActionButton('View', 'entity-action-btn', () => showHouseholdDetailsView(pageState.selectedHousehold)),
        createActionButton('Edit', 'entity-action-btn', () => showEditHouseholdView(pageState.selectedHousehold)),
        createActionButton('Delete', 'entity-action-btn entity-action-btn--danger', () => openHouseholdDeleteDialog(pageState.selectedHousehold), {
            disabled: !canDeleteHousehold(pageState.selectedHousehold),
            title: 'Only manually saved household records can be deleted.'
        })
    )

    elements.actionBar.append(label, actions)
}

function showAddHouseholdView() {
    pageState.editingHousehold = null
    pageState.selectedMemberIds = new Set()
    elements.form?.reset()
    setText(elements.formTitle, 'Add Household')
    setText(elements.formError, '')
    showSubview(SUBVIEWS.FORM)
    renderMemberRows()
    renderHeadOptions()
}

function showEditHouseholdView(household) {
    pageState.editingHousehold = household
    pageState.selectedMemberIds = new Set(getHouseholdMemberIds(household))

    elements.form?.reset()
    setText(elements.formTitle, 'Edit Household')
    setInputValue(elements.nameInput, household.name)
    setText(elements.formError, '')
    showSubview(SUBVIEWS.FORM)
    renderMemberRows()
    renderHeadOptions()
    setInputValue(elements.headSelect, getHouseholdHeadId(household))
}

function showHouseholdDetailsView(household) {
    if (!elements.detailsContent) return

    renderHouseholdDetails(household)
    showSubview(SUBVIEWS.DETAILS)
}

function renderHouseholdDetails(household) {
    const memberNames = getHouseholdMembers(household).map(getResidentFullName)
    elements.detailsContent.innerHTML = getHouseholdDetailsHtml(household, memberNames)

    elements.detailsContent.querySelector('.entity-detail-actions').append(
        createActionButton('Edit', 'entity-action-btn', () => showEditHouseholdView(household)),
        createActionButton('Delete', 'entity-action-btn entity-action-btn--danger', () => openHouseholdDeleteDialog(household), {
            disabled: !canDeleteHousehold(household),
            title: 'Only manually saved household records can be deleted.'
        })
    )
}

function getHouseholdDetailsHtml(household, memberNames) {
    const memberList = memberNames.length
        ? memberNames.map(name => `<li>${escapeHtml(name)}</li>`).join('')
        : '<li>No members selected.</li>'

    return `
        <div class="entity-detail-header">
            <div>
                <h3>${escapeHtml(household.name)}</h3>
                <p>${escapeHtml(household.address || 'No address recorded')}</p>
            </div>
            <div class="entity-detail-actions"></div>
        </div>
        <dl class="entity-detail-grid">
            <div><dt>Household Head</dt><dd>${escapeHtml(household.head || 'Not specified')}</dd></div>
            <div><dt>Members</dt><dd>${escapeHtml(String(household.memberCount ?? 0))}</dd></div>
            <div><dt>Record Type</dt><dd>${escapeHtml(getHouseholdRecordType(household))}</dd></div>
        </dl>
        <div class="entity-detail-section">
            <h3>Household Members</h3>
            <ul class="entity-detail-list">${memberList}</ul>
        </div>
    `
}

function showHouseholdsListView() {
    pageState.editingHousehold = null
    showSubview(SUBVIEWS.LIST)
    renderHouseholds()
}

function showSubview(view) {
    if (elements.listView) elements.listView.hidden = view !== SUBVIEWS.LIST
    if (elements.addView) elements.addView.hidden = view !== SUBVIEWS.FORM
    if (elements.detailsView) elements.detailsView.hidden = view !== SUBVIEWS.DETAILS
}

function renderMemberRows() {
    if (!elements.membersBody) return

    const filteredResidents = getFilteredResidents()
    clearElement(elements.membersBody)

    if (filteredResidents.length === 0) {
        elements.membersBody.appendChild(createEmptyMemberRow())
        return
    }

    filteredResidents.forEach((resident) => {
        elements.membersBody.appendChild(createMemberRow(resident))
    })
}

function getFilteredResidents() {
    const query = elements.memberSearch?.value.trim().toLowerCase() ?? ''

    if (!query) return pageState.residents

    return pageState.residents.filter((resident) => (
        getResidentFullName(resident).toLowerCase().includes(query) ||
        resident.address?.toLowerCase().includes(query)
    ))
}

function createEmptyMemberRow() {
    const row = document.createElement('tr')
    const cell = document.createElement('td')

    cell.className = 'household-members-empty'
    cell.colSpan = 5
    cell.textContent = 'No residents found.'
    row.appendChild(cell)

    return row
}

function createMemberRow(resident) {
    const row = document.createElement('tr')
    const residentId = getResidentId(resident)
    const cells = [
        createMemberNameCell(resident, residentId),
        resident.birthDate,
        getSexLabel(resident.sex),
        getCivilStatusLabel(resident.civilStatus),
        getSectorLabel(resident.sector)
    ]

    cells.forEach((cell) => {
        row.appendChild(createTableCell(cell))
    })

    return row
}

function createTableCell(content) {
    const cell = document.createElement('td')

    if (content instanceof Node) {
        cell.appendChild(content)
    }
    else {
        cell.textContent = content
    }

    return cell
}

function createMemberNameCell(resident, residentId) {
    const label = document.createElement('label')
    const checkbox = document.createElement('input')
    const name = document.createElement('span')

    label.className = 'household-member-check'
    checkbox.type = 'checkbox'
    checkbox.checked = pageState.selectedMemberIds.has(residentId)
    checkbox.addEventListener('change', () => {
        toggleSelectedMember(residentId, checkbox.checked)
    })
    name.textContent = getResidentFullName(resident)

    label.append(checkbox, name)
    return label
}

function toggleSelectedMember(residentId, isSelected) {
    if (isSelected) {
        pageState.selectedMemberIds.add(residentId)
    }
    else {
        pageState.selectedMemberIds.delete(residentId)
    }

    renderHeadOptions()
}

function renderHeadOptions() {
    if (!elements.headSelect) return

    const previousValue = elements.headSelect.value
    const selectedResidents = getSelectedResidents()

    elements.headSelect.innerHTML = '<option value="">Select household head</option>'
    selectedResidents.forEach((resident) => {
        elements.headSelect.appendChild(createResidentOption(resident))
    })

    if (pageState.selectedMemberIds.has(Number(previousValue))) {
        elements.headSelect.value = previousValue
    }
}

function createResidentOption(resident) {
    const option = document.createElement('option')

    option.value = String(getResidentId(resident))
    option.textContent = getResidentFullName(resident)

    return option
}

function handleHouseholdSubmit(event) {
    event.preventDefault()

    const household = getHouseholdFormValues()
    const validationError = getHouseholdValidationError(household)

    if (validationError) {
        setText(elements.formError, validationError)
        return
    }

    const updatedHouseholds = getUpdatedManualHouseholds(household)

    writeManualHouseholds(updatedHouseholds)
    pageState.households = getMergedHouseholds(updatedHouseholds)
    showHouseholdsListView()
}

function getUpdatedManualHouseholds(household) {
    const previousAddress = pageState.editingHousehold?.address?.toLowerCase()
    const previousId = pageState.editingHousehold?.id

    return [
        ...readManualHouseholds().filter((item) => (
            item.id !== previousId &&
            item.address.toLowerCase() !== household.address.toLowerCase() &&
            item.address.toLowerCase() !== previousAddress
        )),
        household
    ]
}

function getHouseholdFormValues() {
    const selectedResidents = getSelectedResidents()
    const headId = Number(elements.headSelect?.value)
    const headResident = selectedResidents.find(resident => getResidentId(resident) === headId)
    const firstResident = selectedResidents[0]
    const name = elements.nameInput?.value.trim() ?? ''

    return {
        id: pageState.editingHousehold?.source?.includes('manual') ? pageState.editingHousehold.id : `manual-${Date.now()}`,
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
    return pageState.residents.filter(resident => pageState.selectedMemberIds.has(getResidentId(resident)))
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

function openHouseholdDeleteDialog(household) {
    if (!canDeleteHousehold(household) || !hasDeleteDialogElements()) return

    const closeDialog = () => closeHouseholdDeleteDialog()

    elements.deleteCloseBtn.onclick = closeDialog
    elements.deleteCancelBtn.onclick = closeDialog
    elements.deleteDialog.onclick = (event) => {
        if (!isClickInsideDialog(elements.deleteDialog, event)) closeDialog()
    }
    elements.deleteConfirmBtn.onclick = () => confirmHouseholdDelete(household)

    setDeleteDialogContent(household)
    elements.deleteDialog.showModal()
}

function hasDeleteDialogElements() {
    return Boolean(
        elements.deleteDialog &&
        elements.deleteCloseBtn &&
        elements.deleteCancelBtn &&
        elements.deleteConfirmBtn &&
        elements.deleteCopy &&
        elements.deleteError
    )
}

function setDeleteDialogContent(household) {
    elements.deleteCopy.textContent = `This will remove ${household.name} from the household records.`
    elements.deleteError.textContent = ''
    elements.deleteConfirmBtn.disabled = false
    elements.deleteConfirmBtn.textContent = 'Delete'
}

function closeHouseholdDeleteDialog() {
    elements.deleteError.textContent = ''
    elements.deleteConfirmBtn.disabled = false
    elements.deleteConfirmBtn.textContent = 'Delete'
    elements.deleteDialog.close()
}

function confirmHouseholdDelete(household) {
    elements.deleteConfirmBtn.disabled = true
    elements.deleteConfirmBtn.textContent = 'Deleting...'
    elements.deleteError.textContent = ''

    try {
        const updatedHouseholds = readManualHouseholds().filter((item) => (
            item.id !== household.id &&
            item.address.toLowerCase() !== household.address.toLowerCase()
        ))

        writeManualHouseholds(updatedHouseholds)
        pageState.households = getMergedHouseholds(updatedHouseholds)
        closeHouseholdDeleteDialog()
        showHouseholdsListView()
    }
    catch (error) {
        elements.deleteConfirmBtn.disabled = false
        elements.deleteConfirmBtn.textContent = 'Delete'
        elements.deleteError.textContent = 'Failed to delete household. Please try again.'
        console.error(error)
    }
}

function isClickInsideDialog(dialog, event) {
    const rect = dialog.getBoundingClientRect()

    return (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
    )
}

function createActionButton(label, className, onClick, options = {}) {
    const button = document.createElement('button')

    button.className = className
    button.type = 'button'
    button.textContent = label
    button.disabled = Boolean(options.disabled)
    if (options.title) button.title = options.title
    button.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!button.disabled) onClick()
    })

    return button
}

function setText(element, value) {
    if (element) element.textContent = value
}

function setInputValue(input, value) {
    if (input) input.value = value ?? ''
}

function canDeleteHousehold(household) {
    return household.source?.includes('manual')
}

function getHouseholdRecordType(household) {
    return canDeleteHousehold(household) ? 'Manual record' : 'Resident address group'
}

function getHouseholdMembers(household) {
    const memberIds = getHouseholdMemberIds(household)
    return pageState.residents.filter(resident => memberIds.includes(getResidentId(resident)))
}

function getHouseholdMemberIds(household) {
    if (Array.isArray(household.memberIds) && household.memberIds.length > 0) {
        return household.memberIds
    }

    return pageState.residents
        .filter(resident => resident.address?.trim().toLowerCase() === household.address?.trim().toLowerCase())
        .map(getResidentId)
}

function getHouseholdHeadId(household) {
    if (household.headId) return household.headId

    const headResident = getHouseholdMembers(household).find(resident => getResidentFullName(resident) === household.head)
    return headResident ? getResidentId(headResident) : ''
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

function createEmptyMessage(message, className) {
    const element = document.createElement('p')
    element.className = className
    element.textContent = message
    return element
}

function clearElement(element) {
    if (element) element.innerHTML = ''
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[char])
}

function sortByName(a, b) {
    return a.name.localeCompare(b.name)
}

function getMemberCountLabel(memberCount) {
    return `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`
}

function getSexLabel(sex) {
    return SEX_LABELS[sex] ?? 'Unknown'
}

function getSectorLabel(sector) {
    return SECTOR_LABELS[sector] ?? 'Unknown'
}

function getCivilStatusLabel(civilStatus) {
    return CIVIL_STATUS_LABELS[civilStatus] ?? 'Unknown'
}
