import { deleteData, getData } from './api.js'

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

function getResidentId(resident) {
    return resident.residentId ?? resident.ResidentId ?? resident.id
}

function openDeleteDialog(resident, options = {}) {
    const dialog = document.getElementById('deleteConfirmDialog')
    const closeBtn = document.getElementById('deleteDialogCloseBtn')
    const cancelBtn = document.getElementById('deleteDialogCancelBtn')
    const confirmBtn = document.getElementById('deleteDialogConfirmBtn')
    const errorEl = document.getElementById('deleteDialogError')
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
            const freshData = await getData('/residents/filter?from=0&limit=50')
            await loadData(freshData, options)
            return
        }

        confirmBtn.disabled = false
        confirmBtn.textContent = 'Delete'
        errorEl.textContent = 'Failed to delete resident. Please try again.'
        console.error(result?.message ?? 'Delete request failed.')
    }

    errorEl.textContent = ''
    confirmBtn.disabled = false
    confirmBtn.textContent = 'Delete'
    dialog.showModal()
}

export async function loadData(result, options = {}) {
    console.log(result)
    const fieldNames = getFieldNames()
    const classes = [
        'col-name',
        'col-suffix',
        'col-birthdate',
        'col-sex',
        'col-sector',
        'col-civilstatus',
        'col-address',
        'col-action'
    ]

    const dataContainer = document.getElementById('dataContainer')
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
                    <button class="delete-btn" type="button">Delete</button>
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

        const deleteBtn = actionTd.querySelector('.delete-btn')
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            actionTd.querySelector('.row-action').classList.remove('open')
            openDeleteDialog(resident, options)
        })

        row.appendChild(actionTd)
        tableBody.appendChild(row)
    })

    table.append(colGroup, tableHeader, tableBody)
    dataContainer.appendChild(table)
}
