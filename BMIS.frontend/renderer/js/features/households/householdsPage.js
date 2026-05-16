import { getData } from '../../core/api.js'
import { SUBVIEWS } from './householdConstants.js'
import { clearElement, createActionButton, createEmptyMessage, createTableCell, getHouseholdElements, setInputValue, setText } from './householdDom.js'
import { escapeHtml, getCivilStatusLabel, getMemberCountLabel, getResidentFullName, getResidentId, getSectorLabel, getSexLabel } from './householdFormatters.js'
import {
    canDeleteHousehold,
    getHouseholdFormValues,
    getHouseholdHeadId,
    getHouseholdMemberIds,
    getHouseholdMembers,
    getHouseholdRecordType,
    getHouseholdValidationError,
    getMergedHouseholds,
    getUpdatedManualHouseholds
} from './householdRecords.js'
import { readManualHouseholds, writeManualHouseholds } from './householdStorage.js'

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
    pageState.households = getMergedHouseholds(pageState.residents, readManualHouseholds())
    renderHouseholds()
}

async function getResidents() {
    const result = await getData('/residents')
    if (!result?.success || !Array.isArray(result.data)) return []

    return result.data
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
    pageState.selectedMemberIds = new Set(getHouseholdMemberIds(household, pageState.residents))

    elements.form?.reset()
    setText(elements.formTitle, 'Edit Household')
    setInputValue(elements.nameInput, household.name)
    setText(elements.formError, '')
    showSubview(SUBVIEWS.FORM)
    renderMemberRows()
    renderHeadOptions()
    setInputValue(elements.headSelect, getHouseholdHeadId(household, pageState.residents))
}

function showHouseholdDetailsView(household) {
    if (!elements.detailsContent) return

    renderHouseholdDetails(household)
    showSubview(SUBVIEWS.DETAILS)
}

function renderHouseholdDetails(household) {
    const memberNames = getHouseholdMembers(household, pageState.residents).map(getResidentFullName)
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

    const household = getCurrentHouseholdFormValues()
    const validationError = getHouseholdValidationError(household)

    if (validationError) {
        setText(elements.formError, validationError)
        return
    }

    const updatedHouseholds = getUpdatedManualHouseholds({
        manualHouseholds: readManualHouseholds(),
        household,
        editingHousehold: pageState.editingHousehold
    })

    writeManualHouseholds(updatedHouseholds)
    pageState.households = getMergedHouseholds(pageState.residents, updatedHouseholds)
    showHouseholdsListView()
}

function getCurrentHouseholdFormValues() {
    return getHouseholdFormValues({
        selectedResidents: getSelectedResidents(),
        headId: Number(elements.headSelect?.value),
        name: elements.nameInput?.value.trim() ?? '',
        editingHousehold: pageState.editingHousehold
    })
}

function getSelectedResidents() {
    return pageState.residents.filter(resident => pageState.selectedMemberIds.has(getResidentId(resident)))
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
        pageState.households = getMergedHouseholds(pageState.residents, updatedHouseholds)
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
