function getResidentFullName(resident) {
    const middleInitial = resident.middleName ? `${resident.middleName[0]}.` : ''
    return `${resident.lastName}, ${resident.firstName} ${middleInitial}`.trim()
}

function readResidentHistory(key) {
    try {
        const rawHistory = localStorage.getItem(key)
        return rawHistory ? JSON.parse(rawHistory) : []
    }
    catch (error) {
        console.error('Failed to read resident history.', error)
        return []
    }
}

function writeResidentHistory(key, history) {
    localStorage.setItem(key, JSON.stringify(history))
}

export function addResidentHistoryLog(key, resident) {
    const history = readResidentHistory(key)
    const log = {
        id: `${Date.now()}-${resident.residentId}`,
        type: 'resident-added',
        residentId: resident.residentId,
        residentName: getResidentFullName(resident),
        address: resident.address,
        createdAt: new Date().toISOString()
    }

    history.unshift(log)
    writeResidentHistory(key, history.slice(0, 100))
}

export function loadHistory(key) {
    const historyContainer = document.getElementById('historyContainer')
    if (!historyContainer) return

    const history = readResidentHistory(key)
    historyContainer.innerHTML = ''

    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="history-empty">No resident history yet.</p>'
        return
    }

    const table = document.createElement('table')
    table.id = 'historyTable'

    const tableHeader = document.createElement('thead')
    const headerRow = document.createElement('tr')
    const fieldNames = ['Date', 'Activity', 'Resident', 'Address']

    fieldNames.forEach(field => {
        const th = document.createElement('th')
        th.textContent = field
        headerRow.appendChild(th)
    })

    tableHeader.appendChild(headerRow)

    const tableBody = document.createElement('tbody')
    history.forEach(log => {
        const row = document.createElement('tr')
        const createdAt = new Date(log.createdAt)
        const cells = [
            createdAt.toLocaleString(),
            'Added resident',
            log.residentName,
            log.address
        ]

        cells.forEach(value => {
            const td = document.createElement('td')
            td.textContent = value
            row.appendChild(td)
        })

        tableBody.appendChild(row)
    })

    table.append(tableHeader, tableBody)
    historyContainer.appendChild(table)
}