import { getResidentFullName, getResidentId } from '../../shared/residentUtils.js'

const HISTORY_LIMIT = 100
const HISTORY_TYPES = {
    RESIDENT_ADDED: 'resident-added',
    RESIDENT_UPDATED: 'resident-updated',
    RESIDENT_DELETED: 'resident-deleted'
}

const ACTIVITY_LABELS = {
    [HISTORY_TYPES.RESIDENT_ADDED]: 'Added resident',
    [HISTORY_TYPES.RESIDENT_UPDATED]: 'Updated resident',
    [HISTORY_TYPES.RESIDENT_DELETED]: 'Deleted resident'
}

let activeHistory = []

function getHistoryActivity(type) {
    return ACTIVITY_LABELS[type] ?? 'Updated resident'
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
    addResidentLog(key, resident, HISTORY_TYPES.RESIDENT_ADDED)
}

export function addResidentDeletedHistoryLog(key, resident) {
    addResidentLog(key, resident, HISTORY_TYPES.RESIDENT_DELETED)
}

export function addResidentUpdatedHistoryLog(key, resident) {
    addResidentLog(key, resident, HISTORY_TYPES.RESIDENT_UPDATED)
}

function addResidentLog(key, resident, type) {
    const history = readResidentHistory(key)
    const residentId = getResidentId(resident)
    const log = {
        id: `${Date.now()}-${residentId}`,
        type,
        residentId,
        residentName: getResidentFullName(resident, { includeSuffix: false }),
        address: resident.address ?? '',
        createdAt: new Date().toISOString()
    }

    history.unshift(log)
    writeResidentHistory(key, history.slice(0, HISTORY_LIMIT))
}

export function loadHistory(key) {
    const historyContainer = document.getElementById('historyContainer')
    if (!historyContainer) return

    activeHistory = readResidentHistory(key)
    bindHistoryControls(key)
    renderHistory(activeHistory)
}

function bindHistoryControls(key) {
    const searchInput = document.getElementById('historySearchInput')
    const typeFilter = document.getElementById('historyTypeFilter')
    const clearBtn = document.getElementById('historyClearBtn')

    searchInput?.addEventListener('input', () => renderHistory(activeHistory))
    typeFilter?.addEventListener('change', () => renderHistory(activeHistory))
    clearBtn?.addEventListener('click', () => {
        if (activeHistory.length === 0) return
        if (!window.confirm('Clear all recorded activity on this device?')) return

        localStorage.removeItem(key)
        activeHistory = []
        renderHistory(activeHistory)
    })
}

function renderHistory(history) {
    const historyContainer = document.getElementById('historyContainer')
    if (!historyContainer) return

    const filteredHistory = getFilteredHistory(history)

    renderSummary(history)
    historyContainer.innerHTML = ''

    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="history-empty">No resident history yet.</p>'
        return
    }

    if (filteredHistory.length === 0) {
        historyContainer.innerHTML = '<p class="history-empty">No matching activity found.</p>'
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
    filteredHistory.forEach(log => {
        const row = document.createElement('tr')

        row.append(
            createCell(formatDate(log.createdAt)),
            createActivityCell(log.type),
            createCell(log.residentName || 'Unknown resident'),
            createCell(log.address || 'No address recorded')
        )

        tableBody.appendChild(row)
    })

    table.append(tableHeader, tableBody)
    historyContainer.appendChild(table)
}

function getFilteredHistory(history) {
    const searchQuery = document.getElementById('historySearchInput')?.value.trim().toLowerCase() ?? ''
    const typeFilter = document.getElementById('historyTypeFilter')?.value ?? ''

    return history.filter((log) => {
        const matchesType = !typeFilter || log.type === typeFilter
        const searchable = `${log.residentName ?? ''} ${log.address ?? ''} ${getHistoryActivity(log.type)}`.toLowerCase()
        const matchesSearch = !searchQuery || searchable.includes(searchQuery)

        return matchesType && matchesSearch
    })
}

function renderSummary(history) {
    setText('historyTotalCount', history.length)
    setText('historyAddedCount', countByType(history, HISTORY_TYPES.RESIDENT_ADDED))
    setText('historyUpdatedCount', countByType(history, HISTORY_TYPES.RESIDENT_UPDATED))
    setText('historyDeletedCount', countByType(history, HISTORY_TYPES.RESIDENT_DELETED))
}

function countByType(history, type) {
    return history.filter(log => log.type === type).length
}

function createCell(value) {
    const td = document.createElement('td')
    td.textContent = value
    return td
}

function createActivityCell(type) {
    const td = document.createElement('td')
    const badge = document.createElement('span')

    badge.className = `history-badge history-badge--${type}`
    badge.textContent = getHistoryActivity(type)
    td.appendChild(badge)

    return td
}

function formatDate(value) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Unknown date'

    return date.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    })
}

function setText(id, value) {
    const element = document.getElementById(id)
    if (element) element.textContent = value
}
