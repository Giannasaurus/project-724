import { compareResidentsByName, getResidentFullName, getSectorLabel, getSexLabel } from '../../shared/residentUtils.js'
import { createResidentActions } from './residentActions.js'
import { openResidentDetails } from './residentDetailsView.js'

function getFieldNames() {
    return ["Full Name", "Birthdate", "Sex", "Sector", "Household", "Contact", "Address"]
}

function getCells(resident) {
    return [
        { value: getResidentFullName(resident), class: 'col-name' },
        { value: resident.birthDate, class: 'col-birthdate' },
        { value: getSexLabel(resident.sex), class: 'col-sex' },
        { value: getSectorLabel(resident.sector), class: 'col-sector' },
        { value: getHouseholdLabel(resident), class: 'col-household' },
        { value: getContactLabel(resident), class: 'col-contact' },
        { value: resident.address, class: 'col-address' }
    ]
}

export async function loadData(result, options = {}) {
    const fieldNames = getFieldNames()
    const classes = [
        'col-name',
        'col-birthdate',
        'col-sex',
        'col-sector',
        'col-household',
        'col-contact',
        'col-address'
    ]

    const recordsPanel = document.getElementById('residentRecordsPanel') ?? document.getElementById('iLView')
    const paginationContainer = document.getElementById('paginationContainer')
    const actionBarMount = document.getElementById('residentActionBarMount')
    if (!recordsPanel || !paginationContainer || !actionBarMount) {
        console.error('Residents view is not mounted')
        return
    }

    let dataContainer = document.getElementById('dataContainer')
    if (!dataContainer) {
        dataContainer = document.createElement('div')
        dataContainer.id = 'dataContainer'
        recordsPanel.insertBefore(dataContainer, paginationContainer)
    }

    dataContainer.innerHTML = ''

    if (!result.success) {
        console.error(result.message)
        dataContainer.innerHTML = "<p>Error loading residents.</p>"
        return
    }

    const table = document.createElement('table')
    table.setAttribute('id', 'dataTable')

    const colGroup = document.createElement('colgroup')
    classes.forEach(className => {
        const col = document.createElement('col')
        col.className = className
        colGroup.appendChild(col)
    })

    const tableHeader = document.createElement('thead')
    const headerRow = document.createElement('tr')
    fieldNames.forEach(field => {
        const th = document.createElement('th')
        th.textContent = field
        headerRow.appendChild(th)
    })
    tableHeader.appendChild(headerRow)

    const tableBody = document.createElement('tbody')
    let selectedResident = null
    let selectedRow = null

    const actionBar = document.createElement('div')
    actionBar.className = 'entity-selection-bar'
    actionBar.hidden = true
    actionBarMount.replaceChildren(actionBar)

    getSortedResidents(result.data).forEach(resident => {
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
    dataContainer.appendChild(table)

    function selectResidentRow(row, resident) {
        selectedResident = resident
        selectedRow?.classList.remove('is-selected')
        selectedRow = row
        selectedRow.classList.add('is-selected')
        renderResidentActionBar(actionBar, selectedResident, options)
    }
}

function getSortedResidents(residents) {
    return [...residents].sort(compareResidentsByName)
}

function getHouseholdLabel(resident) {
    if (resident.householdRole === 'Head') return 'Head'
    if (resident.householdRole === 'Member') return `Member of ${resident.householdHeadName || 'household'}`
    return 'Not recorded'
}

function getContactLabel(resident) {
    return resident.contact || resident.email || 'Not recorded'
}

function renderResidentActionBar(actionBar, resident, options) {
    actionBar.hidden = false
    actionBar.innerHTML = ''

    const label = document.createElement('span')
    label.className = 'entity-selection-label'
    label.textContent = `Selected resident: ${getResidentFullName(resident)}`

    actionBar.append(label, createResidentActions(resident, options, {
        onView: selectedResident => openResidentDetails(selectedResident, options)
    }))
}
