const RESIDENT_SEARCH_DEBOUNCE_MS = 250

export function handleSearchInput({ onSearch }) {
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
