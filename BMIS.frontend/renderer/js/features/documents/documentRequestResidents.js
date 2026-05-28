import { searchResidentsByName } from '../residents/residentSearch.js'
import { isResidentArchived } from '../residents/residentBackendAdapter.js'
import { RESIDENT_SEARCH_LIMIT } from './documentRequestConstants.js'
import { clearElement } from './documentRequestDom.js'
import { getResidentFullName } from './documentRequestFormatters.js'

export async function findResidents(query) {
    const result = await searchResidentsByName(query, {
        from: 0,
        limit: RESIDENT_SEARCH_LIMIT
    })

    return result?.success && Array.isArray(result.data) ? result.data : []
}

export function renderSearchResults(elements, residents, onSelectResident) {
    if (!elements.resultsContainer) return

    clearElement(elements.resultsContainer)

    if (residents.length === 0) {
        renderSearchMessage(elements, 'No residents found.')
        return
    }

    residents.forEach((resident) => {
        elements.resultsContainer.appendChild(createResidentResultButton(resident, onSelectResident))
    })
}

export function renderSearchMessage(elements, message) {
    if (!elements.resultsContainer) return

    const messageElement = document.createElement('p')
    messageElement.className = 'dr-search-empty'
    messageElement.textContent = message

    clearElement(elements.resultsContainer)
    elements.resultsContainer.appendChild(messageElement)
}

function createResidentResultButton(resident, onSelectResident) {
    const button = document.createElement('button')
    const name = document.createElement('span')
    const address = document.createElement('small')

    button.className = 'dr-resident-result'
    button.type = 'button'
    button.disabled = isResidentArchived(resident)
    button.title = button.disabled
        ? 'This resident record is archived and retained for reference only.'
        : ''
    name.textContent = getResidentFullName(resident)
    address.textContent = isResidentArchived(resident)
        ? `${resident.address ?? ''} - Archived record`
        : resident.address ?? ''
    button.append(name, address)
    button.addEventListener('click', () => onSelectResident(resident))

    return button
}
