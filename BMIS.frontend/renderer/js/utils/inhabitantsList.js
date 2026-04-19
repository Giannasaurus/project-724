function getFieldNames() {
    return ["Full Name", "Suffix", "Birthdate", "Sex", "Sector", "Civil Status", "Address", ""]
}

function getCells(resident) {
    const middleInitial = resident.middleName ? `${resident.middleName[0]}.` : ''
    const fullName = `${resident.lastName}, ${resident.firstName} ${middleInitial}`
    const sexes = { 0: "Male", 1: "Female" }
    const sectors = { 0: "General", 1: "Senior", 2: "PWD" }
    const civilStatuses = {
        0: "Single",
        1: "Married",
        2: "Widowed",
        3: "Divorced",
        4: "Annulled",
        5: "Legally Separated"
    }

    return [
        { value: fullName, class: 'col-name' },
        { value: resident.suffix, class: 'col-suffix' },
        { value: resident.birthDate, class: 'col-birthdate' },
        { value: sexes[resident.sex], class: 'col-sex' },
        { value: sectors[resident.sector], class: 'col-sector' },
        { value: civilStatuses[resident.civilStatus], class: 'col-civilstatus' },
        { value: resident.address, class: 'col-address' }
    ]
}

export async function loadData(result) {
    console.log(result)
    const fieldNames = getFieldNames()
    const classes = []

    const dataContainer = document.getElementById('dataContainer')
    dataContainer.innerHTML = ''

    if (!result.success) {
        console.error(result.message)
        dataContainer.innerHTML = "<p>Error loading residents.</p>"
        return
    }

    // make table
    const table = document.createElement('table')
    table.setAttribute('id', 'testDataTable')

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
    
    result.data.forEach(resident => {
        const cells = getCells(resident)
        const row = document.createElement('tr')

        cells.forEach(cell => {
            const td = document.createElement('td')
            td.textContent = cell.value
            td.className = cell.class
            row.appendChild(td)
        })

        // make action button + context menu
        const actionTd = document.createElement('td')
        actionTd.className = 'col-action'
        actionTd.innerHTML = `
            <div class="row-action">
                <button class="ellipsis-btn">•••</button>
                <div class="context-menu">
                    <button>Edit</button>
                    <hr class="context-menu-divider">
                    <button>Delete</button>
                </div>
            </div>
        `
        actionTd.querySelector('.ellipsis-btn').addEventListener('click', (e) => {
            e.stopPropagation()
            const rowAction = actionTd.querySelector('.row-action')
            const isOpen = rowAction.classList.contains('open')
            document.querySelectorAll('.row-action.open').forEach(el => el.classList.remove('open'))
            if (!isOpen) rowAction.classList.add('open')
        })

        row.appendChild(actionTd)
        tableBody.appendChild(row)
    })

    table.append(colGroup, tableHeader, tableBody)
    dataContainer.appendChild(table)
}