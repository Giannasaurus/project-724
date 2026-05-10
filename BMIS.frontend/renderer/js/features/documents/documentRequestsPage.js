import { getData } from '../../core/api.js'

const DOCUMENT_TYPES = {
    0: 'Barangay Clearance',
    1: 'Certificate of Residency',
    2: 'Certificate of Indigency'
}

const OTHER_REASON_VALUE = 'other'

const REASON_OPTIONS = {
    medical: {
        label: 'Medical Assistance',
        checkboxIds: ['option-medical-asst']
    },
    financial: {
        label: 'Financial Assistance',
        checkboxIds: ['option-finance-asst']
    },
    food: {
        label: 'Food Assistance',
        checkboxIds: ['option-food-asst']
    },
    scholarship: {
        label: 'Scholarship',
        checkboxIds: ['option-scholarship']
    },
    education: {
        label: 'Educational Assistance',
        checkboxIds: ['option-educ-asst']
    },
    funeral: {
        label: 'Funeral/Burial Assistance',
        checkboxIds: ['option-funeral-asst']
    },
    soloParentPwd: {
        label: 'Solo Parent/PWD Assistance',
        checkboxIds: ['option-solo-parent-pwd']
    },
    residency: {
        label: 'Proof of Residency',
        checkboxIds: ['option-proof-residency']
    },
    orangeCard: {
        label: 'Orange Card',
        checkboxIds: ['option-orange-car']
    },
    other: {
        label: 'Others, please specify',
        checkboxIds: ['option-others']
    }
}

let selectedResident = null
let currentDocumentHtml = ''

export function initDocumentRequestsPage(options = {}) {
    selectedResident = options.selectedResident ?? null
    currentDocumentHtml = ''

    bindSearchControls()
    bindDocumentControls()
    setSelectedResident(selectedResident)
}

function bindSearchControls() {
    const searchInput = document.getElementById('dr-residentSearch')
    const searchBtn = document.getElementById('dr-searchBtn')
    const clearSearchBtn = document.getElementById('dr-clearSearchBtn')

    if (selectedResident && searchInput) {
        searchInput.value = getResidentFullName(selectedResident)
    }

    updateClearSearchButton()

    searchBtn?.addEventListener('click', searchResidents)
    clearSearchBtn?.addEventListener('click', clearResidentSearch)
    searchInput?.addEventListener('input', updateClearSearchButton)
    searchInput?.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return

        event.preventDefault()
        searchResidents()
    })
}

function clearResidentSearch() {
    const searchInput = document.getElementById('dr-residentSearch')
    const selectedContainer = document.getElementById('dr-selectedResident')
    const resultsContainer = document.getElementById('dr-searchResults')

    selectedResident = null
    if (searchInput) searchInput.value = ''
    if (selectedContainer) selectedContainer.textContent = ''
    if (resultsContainer) resultsContainer.innerHTML = ''

    clearError()
    clearPreview()
    updateClearSearchButton()
    searchInput?.focus()
}

function updateClearSearchButton() {
    const searchInput = document.getElementById('dr-residentSearch')
    const clearSearchBtn = document.getElementById('dr-clearSearchBtn')
    if (!searchInput || !clearSearchBtn) return

    clearSearchBtn.hidden = searchInput.value.trim().length === 0
}

function bindDocumentControls() {
    const form = document.getElementById('documentRequestForm')
    const previewBtn = document.getElementById('dr-previewBtn')
    const documentType = document.getElementById('dr-documentType')
    const reasonType = document.getElementById('dr-reasonType')
    const otherReason = document.getElementById('dr-otherReason')

    previewBtn?.addEventListener('click', previewDocument)
    documentType?.addEventListener('change', clearPreview)
    reasonType?.addEventListener('change', () => {
        updateOtherReasonState()
        clearPreview()
    })
    otherReason?.addEventListener('input', clearPreview)

    form?.addEventListener('submit', async (event) => {
        event.preventDefault()

        const isReady = currentDocumentHtml || await previewDocument()
        if (!isReady) return

        downloadWordDocument(currentDocumentHtml)
    })

    updateOtherReasonState()
}

async function searchResidents() {
    const query = document.getElementById('dr-residentSearch')?.value.trim()
    const resultsContainer = document.getElementById('dr-searchResults')

    clearError()
    clearPreview()

    if (!query) {
        renderSearchMessage('Enter a resident name to search.')
        return
    }

    renderSearchMessage('Searching...')

    const residents = await findResidents(query)
    renderSearchResults(residents)
}

async function findResidents(query) {
    const fields = ['firstName', 'middleName', 'lastName']
    const responses = await Promise.all(fields.map(async (field) => {
        const params = new URLSearchParams({
            [field]: query,
            from: '0',
            limit: '8'
        })

        return getData(`/residents/filter?${params.toString()}`)
    }))

    const residents = []
    const seenIds = new Set()

    responses.forEach((response) => {
        if (!response?.success || !Array.isArray(response.data)) return

        response.data.forEach((resident) => {
            const residentId = getResidentId(resident)
            if (!residentId || seenIds.has(residentId)) return

            seenIds.add(residentId)
            residents.push(resident)
        })
    })

    return residents
}

function renderSearchResults(residents) {
    const resultsContainer = document.getElementById('dr-searchResults')
    if (!resultsContainer) return

    resultsContainer.innerHTML = ''

    if (residents.length === 0) {
        renderSearchMessage('No residents found.')
        return
    }

    residents.forEach((resident) => {
        const button = document.createElement('button')
        const name = document.createElement('span')
        const address = document.createElement('small')

        button.className = 'dr-resident-result'
        button.type = 'button'
        name.textContent = getResidentFullName(resident)
        address.textContent = resident.address ?? ''
        button.append(name, address)
        button.addEventListener('click', () => {
            setSelectedResident(resident)
            resultsContainer.innerHTML = ''
        })

        resultsContainer.appendChild(button)
    })
}

function renderSearchMessage(message) {
    const resultsContainer = document.getElementById('dr-searchResults')
    if (!resultsContainer) return

    const messageElement = document.createElement('p')
    messageElement.className = 'dr-search-empty'
    messageElement.textContent = message

    resultsContainer.innerHTML = ''
    resultsContainer.appendChild(messageElement)
}

function setSelectedResident(resident) {
    selectedResident = resident
    const selectedContainer = document.getElementById('dr-selectedResident')
    const searchInput = document.getElementById('dr-residentSearch')

    if (!selectedContainer) return

    if (!resident) {
        selectedContainer.textContent = ''
        return
    }

    if (searchInput) {
        searchInput.value = getResidentFullName(resident)
        updateClearSearchButton()
    }

    clearPreview()
    selectedContainer.textContent = `Selected: ${getResidentFullName(resident)}`
}

async function previewDocument() {
    clearError()

    const validationError = getDocumentRequestError()
    if (validationError) {
        setError(validationError)
        return false
    }

    setPreviewStatus('Generating preview...')

    try {
        const html = await getDocumentHtml()
        currentDocumentHtml = applyRequestReason(html)
        renderPreview(currentDocumentHtml)
        setPreviewStatus(`${getSelectedDocumentLabel()} ready`)
        return true
    }
    catch (error) {
        console.error(error)
        currentDocumentHtml = ''
        setPreviewStatus('Preview failed')
        setError('Failed to generate document preview. Please try again.')
        return false
    }
}

function getDocumentRequestError() {
    if (!selectedResident) return 'Select a resident before generating a document.'
    if (!getReasonType()) return 'Select a reason for the document request.'
    if (getReasonType() === OTHER_REASON_VALUE && !getOtherReason()) return 'Specify the reason for the document request.'

    return ''
}

async function getDocumentHtml() {
    const port = await window.electronAPI.getApiPort()
    const documentType = document.getElementById('dr-documentType').value
    const residentId = getResidentId(selectedResident)
    const url = `http://localhost:${port}/docs/${documentType}/${residentId}`
    const response = await fetch(url)

    if (!response.ok) throw new Error(`Document request failed with ${response.status}`)

    return response.text()
}

function applyRequestReason(html) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const reason = REASON_OPTIONS[getReasonType()]
    const othersReason = doc.getElementById('option-others-reason')

    reason?.checkboxIds.forEach((checkboxId) => {
        const checkbox = doc.getElementById(checkboxId)
        if (checkbox) checkbox.setAttribute('checked', 'checked')
    })

    if (othersReason && getReasonType() === OTHER_REASON_VALUE) {
        othersReason.setAttribute('value', getOtherReason())
    }

    return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`
}

function renderPreview(html) {
    const frame = document.getElementById('dr-previewFrame')
    if (frame) frame.srcdoc = html
}

function downloadWordDocument(html) {
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = getDocumentFileName()
    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
}

function getDocumentFileName() {
    const residentName = getResidentFullName(selectedResident).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
    const documentName = getSelectedDocumentLabel().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')

    return `${documentName}-${residentName}.doc`
}

function clearPreview() {
    currentDocumentHtml = ''
    renderPreview('')
    setPreviewStatus('No document generated yet')
}

function clearError() {
    setError('')
}

function setError(message) {
    const error = document.getElementById('dr-error')
    if (error) error.textContent = message
}

function setPreviewStatus(message) {
    const status = document.getElementById('dr-previewStatus')
    if (status) status.textContent = message
}

function getReasonType() {
    return document.getElementById('dr-reasonType')?.value ?? ''
}

function getOtherReason() {
    return document.getElementById('dr-otherReason')?.value.trim() ?? ''
}

function updateOtherReasonState() {
    const otherReason = document.getElementById('dr-otherReason')
    if (!otherReason) return

    const needsOtherReason = getReasonType() === OTHER_REASON_VALUE
    otherReason.disabled = !needsOtherReason
    otherReason.required = needsOtherReason
    otherReason.setAttribute('aria-disabled', String(!needsOtherReason))

    if (!needsOtherReason) {
        otherReason.value = ''
    }
}

function getSelectedDocumentLabel() {
    const documentType = document.getElementById('dr-documentType')?.value ?? '0'
    return DOCUMENT_TYPES[documentType] ?? 'Document'
}

function getResidentFullName(resident) {
    const middleInitial = resident.middleName ? `${resident.middleName[0]}.` : ''
    return `${resident.lastName}, ${resident.firstName} ${middleInitial} ${resident.suffix ?? ''}`.trim()
}

function getResidentId(resident) {
    return resident?.residentId ?? resident?.ResidentId ?? resident?.id
}
