import { deleteData, getData } from '../../core/api.js'
import { openEditResidentPage } from './residentForm.js'

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

const RESIDENT_SEARCH_DEBOUNCE_MS = 250

/* ============================================================
   SEARCH INPUT
   ============================================================ */
export function handleSearchInput({ onSearch, goToPage }) {
    const searchBar = document.getElementById('searchBar')
    const clearSearchBtn = document.getElementById('clearResidentSearchBtn')
    let searchTimer = null

    function updateClearSearchButton() {
        if (!searchBar || !clearSearchBtn) return

        clearSearchBtn.hidden = searchBar.value.trim().length === 0
    }

    async function displayResidents() {
        if (!searchBar) return

        const query = searchBar.value.trim()
        updateClearSearchButton()

        if (!query) {
            await onSearch?.('')
            return
        }

        await onSearch?.(query)
    }

    function scheduleSearch() {
        window.clearTimeout(searchTimer)
        searchTimer = window.setTimeout(displayResidents, RESIDENT_SEARCH_DEBOUNCE_MS)
        updateClearSearchButton()
    }

    if (searchBar) {
        searchBar.addEventListener('input', scheduleSearch)
        searchBar.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault()
                window.clearTimeout(searchTimer)
                displayResidents()
            }
        })
    }

    clearSearchBtn?.addEventListener('click', () => {
        if (!searchBar) return

        window.clearTimeout(searchTimer)
        searchBar.value = ''
        displayResidents()
        searchBar.focus()
    })

    updateClearSearchButton()
}

export function bindResidentFilterControls({ getFilters, onApplyFilters, onClearFilters }) {
    const filterBtn = document.getElementById('btn_filter')
    const filterDialog = document.getElementById('filterMenu')
    const cancelBtn = document.getElementById('cancelFilter')
    const applyBtn = document.getElementById('saveFilter')
    const clearBtn = document.getElementById('clearFilter')
    const closeBtn = document.getElementById('filterDialogCloseBtn')

    filterBtn?.addEventListener('click', () => {
        setResidentFilterFormValues(getFilters?.() ?? {})
        filterDialog?.showModal()
    })
    cancelBtn?.addEventListener('click', () => filterDialog?.close())
    closeBtn?.addEventListener('click', () => filterDialog?.close())
    clearBtn?.addEventListener('click', async () => {
        resetResidentFilterForm()
        await onClearFilters?.()
        filterDialog?.close()
    })
    applyBtn?.addEventListener('click', async () => {
        await onApplyFilters?.(getResidentFilterValues())
        filterDialog?.close()
    })

    filterDialog?.addEventListener('click', closeDialogOnBackdrop)
}

export function renderFilterIndicators(filters, { onApplyFilters, onClearFilters } = {}) {
    const container = document.getElementById('filterIndicators')
    if (!container) return

    const indicators = getFilterIndicators(filters)
    container.innerHTML = ''

    if (indicators.length === 0) return

    indicators.forEach((filter) => {
        const indicator = document.createElement('div')
        const label = document.createElement('span')
        const removeButton = document.createElement('button')

        indicator.className = 'filterOption'
        label.textContent = filter.label
        removeButton.type = 'button'
        removeButton.textContent = '✖'
        removeButton.setAttribute('aria-label', `Remove ${filter.label} filter`)
        removeButton.addEventListener('click', async () => {
            const nextFilters = removeFilter(filters, filter)
            setResidentFilterFormValues(nextFilters)
            await onApplyFilters?.(nextFilters)
        })

        indicator.append(label, removeButton)
        container.appendChild(indicator)
    })

    const clearButton = document.createElement('button')
    clearButton.className = 'filter-clear-all'
    clearButton.type = 'button'
    clearButton.textContent = 'Clear filters'
    clearButton.addEventListener('click', async () => {
        resetResidentFilterForm()
        await onClearFilters?.()
    })

    container.appendChild(clearButton)
}

function getResidentFilterValues() {
    return {
        minAge: getNumberInputValue('filterMinAge'),
        maxAge: getNumberInputValue('filterMaxAge'),
        sex: getCheckedValues('filterSex'),
        sector: getCheckedValues('filterSector'),
        civilStat: getCheckedValues('filterCivil'),
        order: document.getElementById('filterOrder')?.value ?? ''
    }
}

function resetResidentFilterForm() {
    document.getElementById('filterMenu')?.querySelectorAll('input').forEach((input) => {
        if (input.type === 'checkbox') input.checked = false
        if (input.type === 'number') input.value = ''
    })

    const orderSelect = document.getElementById('filterOrder')
    if (orderSelect) orderSelect.value = ''
}

function setResidentFilterFormValues(filters) {
    resetResidentFilterForm()
    setNumberInputValue('filterMinAge', filters.minAge)
    setNumberInputValue('filterMaxAge', filters.maxAge)
    setCheckedValues('filterSex', filters.sex)
    setCheckedValues('filterSector', filters.sector)
    setCheckedValues('filterCivil', filters.civilStat)

    const orderSelect = document.getElementById('filterOrder')
    if (orderSelect) orderSelect.value = filters.order ?? ''
}

function getNumberInputValue(id) {
    const value = document.getElementById(id)?.value.trim()
    return value ? Number(value) : ''
}

function setNumberInputValue(id, value) {
    const input = document.getElementById(id)
    if (input) input.value = value ?? ''
}

function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
        .map(input => input.value)
}

function setCheckedValues(name, values = []) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
        input.checked = values.includes(input.value)
    })
}

function getFilterIndicators(filters = {}) {
    const indicators = []

    if (filters.minAge !== undefined && filters.minAge !== '') indicators.push({ key: 'minAge', label: `Age ${filters.minAge}+` })
    if (filters.maxAge !== undefined && filters.maxAge !== '') indicators.push({ key: 'maxAge', label: `Age up to ${filters.maxAge}` })
    filters.sex?.forEach(value => indicators.push({ key: 'sex', value, label: `Sex: ${value}` }))
    filters.sector?.forEach(value => indicators.push({ key: 'sector', value, label: `Sector: ${value}` }))
    filters.civilStat?.forEach(value => indicators.push({
        key: 'civilStat',
        value,
        label: `Civil: ${getCivilStatusFilterLabel(value)}`
    }))
    if (filters.order) indicators.push({ key: 'order', label: `Sort: ${getOrderLabel(filters.order)}` })

    return indicators
}

function removeFilter(filters, filter) {
    const nextFilters = {
        ...filters,
        sex: [...(filters.sex ?? [])],
        sector: [...(filters.sector ?? [])],
        civilStat: [...(filters.civilStat ?? [])]
    }

    if (Array.isArray(nextFilters[filter.key])) {
        nextFilters[filter.key] = nextFilters[filter.key].filter(value => value !== filter.value)
    }
    else {
        nextFilters[filter.key] = ''
    }

    return nextFilters
}

function getCivilStatusFilterLabel(value) {
    return ({
        Anulled: 'Annulled',
        LegallySeparated: 'Legally Separated'
    })[value] ?? value
}

function getOrderLabel(order) {
    return ({
        ByFirstName: 'First name A-Z',
        ByFirstNameDesc: 'First name Z-A',
        ByMiddleName: 'Middle name A-Z',
        ByMiddleNameDesc: 'Middle name Z-A',
        ByLastName: 'Last name A-Z',
        ByLastNameDesc: 'Last name Z-A',
        ByAge: 'Youngest first',
        ByAgeDesc: 'Oldest first'
    })[order] ?? order
}

function closeDialogOnBackdrop(event) {
    if (event.target !== event.currentTarget) return
    event.currentTarget.close()
}

/** DELETE DIALOG
 * 
 */

function openDeleteDialog(resident, options = {}) {
    const dialog = document.getElementById('deleteConfirmDialog')
    const closeBtn = document.getElementById('deleteDialogCloseBtn')
    const cancelBtn = document.getElementById('deleteDialogCancelBtn')
    const confirmBtn = document.getElementById('deleteDialogConfirmBtn')
    const errorEl = document.getElementById('deleteDialogError')
    const titleEl = dialog?.querySelector('.delete-dialog-header h3')
    const headingEl = dialog?.querySelector('.delete-dialog-body h2')
    const copyEl = dialog?.querySelector('.delete-dialog-copy p')
    const residentId = getResidentId(resident)

    if (!dialog || !closeBtn || !cancelBtn || !confirmBtn || !errorEl) return

    function closeDialog() {
        errorEl.textContent = ''
        confirmBtn.disabled = false
        confirmBtn.textContent = 'Delete'
        dialog.close()
    }

    closeBtn.onclick = closeDialog
    cancelBtn.onclick = closeDialog
    dialog.onclick = (e) => {
        const rect = dialog.getBoundingClientRect()
        const clickedInDialog = (
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width
        )

        if (!clickedInDialog) closeDialog()
    }

    confirmBtn.onclick = async () => {
        if (!residentId) {
            errorEl.textContent = 'Unable to delete this resident. Missing resident ID.'
            return
        }

        confirmBtn.disabled = true
        confirmBtn.textContent = 'Deleting...'
        errorEl.textContent = ''

        let result
        try {
            result = await deleteData('/residents', residentId)
        }
        catch (error) {
            result = { success: false, message: error.message }
        }

        if (result?.success) {
            options.addDeletedHistoryLog?.(resident)
            closeDialog()
            await options.onDeleted?.()
            return
        }

        confirmBtn.disabled = false
        confirmBtn.textContent = 'Delete'
        errorEl.textContent = 'Failed to delete resident. Please try again.'
        console.error(result?.message ?? 'Delete request failed.')
    }

    errorEl.textContent = ''
    if (titleEl) titleEl.textContent = 'Delete resident?'
    if (headingEl) headingEl.textContent = 'Are you sure?'
    if (copyEl) copyEl.textContent = `This will remove ${getResidentFullName(resident)} from the residents list.`
    confirmBtn.disabled = false
    confirmBtn.textContent = 'Delete'
    dialog.showModal()
}

function getFieldNames() {
    return ["Full Name", "Birthdate", "Sex", "Sector", "Civil Status", "Address"]
}

function getCells(resident) {
    return [
        { value: getResidentFullName(resident), class: 'col-name' },
        // { value: resident.suffix, class: 'col-suffix' },
        { value: resident.birthDate, class: 'col-birthdate' },
        { value: SEX_LABELS[resident.sex], class: 'col-sex' },
        { value: SECTOR_LABELS[resident.sector], class: 'col-sector' },
        { value: CIVIL_STATUS_LABELS[resident.civilStatus], class: 'col-civilstatus' },
        { value: resident.address, class: 'col-address' }
    ]
}

function getResidentId(resident) {
    return resident.residentId ?? resident.ResidentId ?? resident.id
}

export async function loadData(result, options = {}) {
    const fieldNames = getFieldNames()
    const classes = [
        'col-name',
        'col-birthdate',
        'col-sex',
        'col-sector',
        'col-civilstatus',
        'col-address'
    ]

    const iLView = document.getElementById('iLView')
    const paginationContainer = document.getElementById('paginationContainer')
    if (!iLView || !paginationContainer) {
        console.error('Residents view is not mounted')
        return
    }

    let dataContainer = document.getElementById('dataContainer')
    if (!dataContainer) {
        dataContainer = document.createElement('div')
        dataContainer.id = 'dataContainer'
        iLView.insertBefore(dataContainer, paginationContainer)
    }

    dataContainer.innerHTML = ''

    if (!result.success) {
        console.error(result.message)
        dataContainer.innerHTML = "<p>Error loading residents.</p>"
        return
    }

    // make table
    const table = document.createElement('table')
    table.setAttribute('id', 'dataTable')

    // make colgroup from column classes
    const colGroup = document.createElement('colgroup')
    classes.forEach(className => {
        const col = document.createElement('col')
        col.className = className
        colGroup.appendChild(col)
    })

    // make header
    const tableHeader = document.createElement('thead')
    const headerRow = document.createElement('tr')
    fieldNames.forEach(field => {
        const th = document.createElement('th')
        th.textContent = field
        headerRow.appendChild(th)
    })
    tableHeader.appendChild(headerRow)

    // make body
    const tableBody = document.createElement('tbody')
    let selectedResident = null
    let selectedRow = null

    const actionBar = document.createElement('div')
    actionBar.className = 'entity-selection-bar'
    actionBar.hidden = true

    result.data.forEach(resident => {
        const cells = getCells(resident)
        const row = document.createElement('tr')
        row.className = 'entity-row'
        row.tabIndex = 0
        row.addEventListener('click', () => selectResidentRow(row, resident))
        row.addEventListener('keydown', (e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return
            e.preventDefault()
            selectResidentRow(row, resident)
        })

        cells.forEach(cell => {
            const td = document.createElement('td')
            td.textContent = cell.value
            td.className = cell.class
            row.appendChild(td)
        })

        tableBody.appendChild(row)
    })

    table.append(colGroup, tableHeader, tableBody)
    dataContainer.appendChild(actionBar)
    dataContainer.appendChild(table)

    function selectResidentRow(row, resident) {
        selectedResident = resident
        selectedRow?.classList.remove('is-selected')
        selectedRow = row
        selectedRow.classList.add('is-selected')
        renderResidentActionBar(actionBar, selectedResident, options)
    }
}

function renderResidentActionBar(actionBar, resident, options) {
    actionBar.hidden = false
    actionBar.innerHTML = ''

    const label = document.createElement('span')
    label.className = 'entity-selection-label'
    label.textContent = `Selected resident: ${getResidentFullName(resident)}`

    actionBar.append(label, createResidentActions(resident, options))
}

function createResidentActions(resident, options, actionOptions = {}) {
    const actions = document.createElement('div')
    actions.className = 'entity-row-actions'
    const buttons = [
        createActionButton('Edit', 'entity-action-btn', () => openEditResidentPage(resident, options)),
        createActionButton('Document Request', 'entity-action-btn', () => options.onDocumentRequest?.(resident)),
        createActionButton('Delete', 'entity-action-btn entity-action-btn--danger', () => {
            openDeleteDialog(resident, {
                addDeletedHistoryLog: options.addDeletedHistoryLog,
                onDeleted: options.showResidentsView
            })
        })
    ]

    if (actionOptions.includeView !== false) {
        buttons.unshift(createActionButton('View', 'entity-action-btn', () => openResidentDetails(resident, options)))
    }

    actions.append(...buttons)

    return actions
}

function createActionButton(label, className, onClick) {
    const button = document.createElement('button')

    button.className = className
    button.type = 'button'
    button.textContent = label
    button.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
    })

    return button
}

function openResidentDetails(resident, options = {}) {
    const iLView = document.getElementById('iLView')
    if (!iLView) return

    const deleteDialog = document.getElementById('deleteConfirmDialog')
    iLView.innerHTML = ''

    const detailsView = document.createElement('section')
    detailsView.className = 'entity-detail-view'
    detailsView.innerHTML = `
        <div class="subview-heading">
            <button class="back-btn" type="button">&lt; Back</button>
            <h2>Resident Details</h2>
        </div>
        <div class="entity-detail-panel">
            <div class="entity-detail-header">
                <div>
                    <h3>${escapeHtml(getResidentFullName(resident))}</h3>
                    <p>${escapeHtml(resident.address ?? 'No address recorded')}</p>
                </div>
                <div class="entity-detail-actions"></div>
            </div>
            <dl class="entity-detail-grid">
                <div><dt>Birthdate</dt><dd>${escapeHtml(resident.birthDate ?? 'Not specified')}</dd></div>
                <div><dt>Sex</dt><dd>${escapeHtml(SEX_LABELS[resident.sex] ?? 'Unknown')}</dd></div>
                <div><dt>Sector</dt><dd>${escapeHtml(SECTOR_LABELS[resident.sector] ?? 'Unknown')}</dd></div>
                <div><dt>Civil Status</dt><dd>${escapeHtml(CIVIL_STATUS_LABELS[resident.civilStatus] ?? 'Unknown')}</dd></div>
                <div><dt>Resident ID</dt><dd>${escapeHtml(String(getResidentId(resident) ?? 'Not available'))}</dd></div>
            </dl>
        </div>
    `

    detailsView.querySelector('.back-btn').addEventListener('click', () => options.showResidentsView?.())
    detailsView.querySelector('.entity-detail-actions').appendChild(createResidentActions(resident, options, {
        includeView: false
    }))
    iLView.appendChild(detailsView)
    if (deleteDialog) iLView.appendChild(deleteDialog)
}

function getResidentFullName(resident) {
    const middleInitial = resident.middleName ? `${resident.middleName[0]}.` : ''
    return `${resident.lastName}, ${resident.firstName} ${middleInitial} ${resident.suffix ?? ''}`.trim()
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
