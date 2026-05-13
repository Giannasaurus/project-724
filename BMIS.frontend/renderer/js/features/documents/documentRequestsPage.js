import { searchResidentsByName } from '../residents/residentSearch.js'

const DOCUMENT_TYPES = {
    0: 'Barangay Clearance',
    1: 'Certificate of Residency',
    2: 'Certificate of Indigency'
}

const OTHER_REASON_VALUE = 'other'
const RESIDENT_SEARCH_LIMIT = 8
const DEFAULT_DOCUMENT_TYPE = '0'
const PREVIEW_EMPTY_STATUS = 'No document generated yet'

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

const pageState = {
    selectedResident: null,
    currentDocumentHtml: ''
}

let elements = {}

export function initDocumentRequestsPage(options = {}) {
    pageState.selectedResident = options.selectedResident ?? null
    pageState.currentDocumentHtml = ''
    elements = getDocumentRequestElements()

    bindSearchControls()
    bindDocumentControls()
    setSelectedResident(pageState.selectedResident)
}

function getDocumentRequestElements() {
    return {
        clearSearchBtn: document.getElementById('dr-clearSearchBtn'),
        documentType: document.getElementById('dr-documentType'),
        error: document.getElementById('dr-error'),
        form: document.getElementById('documentRequestForm'),
        otherReason: document.getElementById('dr-otherReason'),
        previewBtn: document.getElementById('dr-previewBtn'),
        previewFrame: document.getElementById('dr-previewFrame'),
        previewStatus: document.getElementById('dr-previewStatus'),
        reasonType: document.getElementById('dr-reasonType'),
        resultsContainer: document.getElementById('dr-searchResults'),
        searchBtn: document.getElementById('dr-searchBtn'),
        searchInput: document.getElementById('dr-residentSearch'),
        selectedContainer: document.getElementById('dr-selectedResident')
    }
}

function bindSearchControls() {
    elements.searchBtn?.addEventListener('click', searchResidents)
    elements.clearSearchBtn?.addEventListener('click', clearResidentSearch)
    elements.searchInput?.addEventListener('input', updateClearSearchButton)
    elements.searchInput?.addEventListener('keydown', handleSearchKeydown)

    updateClearSearchButton()
}

function bindDocumentControls() {
    elements.previewBtn?.addEventListener('click', previewDocument)
    elements.documentType?.addEventListener('change', clearPreview)
    elements.reasonType?.addEventListener('change', handleReasonChange)
    elements.otherReason?.addEventListener('input', clearPreview)
    elements.form?.addEventListener('submit', handleDocumentSubmit)

    updateOtherReasonState()
}

function handleSearchKeydown(event) {
    if (event.key !== 'Enter') return

    event.preventDefault()
    searchResidents()
}

function handleReasonChange() {
    updateOtherReasonState()
    clearPreview()
}

async function handleDocumentSubmit(event) {
    event.preventDefault()

    const isReady = pageState.currentDocumentHtml || await previewDocument()
    if (!isReady) return

    downloadWordDocument(pageState.currentDocumentHtml)
}

function clearResidentSearch() {
    pageState.selectedResident = null
    if (elements.searchInput) elements.searchInput.value = ''
    clearElement(elements.selectedContainer)
    clearElement(elements.resultsContainer)

    clearError()
    clearPreview()
    updateClearSearchButton()
    elements.searchInput?.focus()
}

function updateClearSearchButton() {
    if (!elements.searchInput || !elements.clearSearchBtn) return

    elements.clearSearchBtn.hidden = elements.searchInput.value.trim().length === 0
}

async function searchResidents() {
    const query = elements.searchInput?.value.trim() ?? ''

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
    const result = await searchResidentsByName(query, {
        from: 0,
        limit: RESIDENT_SEARCH_LIMIT
    })

    return result?.success && Array.isArray(result.data) ? result.data : []
}

function renderSearchResults(residents) {
    if (!elements.resultsContainer) return

    clearElement(elements.resultsContainer)

    if (residents.length === 0) {
        renderSearchMessage('No residents found.')
        return
    }

    residents.forEach((resident) => {
        elements.resultsContainer.appendChild(createResidentResultButton(resident))
    })
}

function createResidentResultButton(resident) {
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
        clearElement(elements.resultsContainer)
    })

    return button
}

function renderSearchMessage(message) {
    if (!elements.resultsContainer) return

    const messageElement = document.createElement('p')
    messageElement.className = 'dr-search-empty'
    messageElement.textContent = message

    clearElement(elements.resultsContainer)
    elements.resultsContainer.appendChild(messageElement)
}

function setSelectedResident(resident) {
    pageState.selectedResident = resident
    if (!elements.selectedContainer) return

    if (!resident) {
        elements.selectedContainer.textContent = ''
        updateClearSearchButton()
        return
    }

    if (elements.searchInput) {
        elements.searchInput.value = getResidentFullName(resident)
        updateClearSearchButton()
    }

    clearPreview()
    elements.selectedContainer.textContent = `Selected: ${getResidentFullName(resident)}`
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
        pageState.currentDocumentHtml = applyRequestReason(html)
        renderPreview(pageState.currentDocumentHtml)
        setPreviewStatus(`${getSelectedDocumentLabel()} ready`)
        return true
    }
    catch (error) {
        console.error(error)
        pageState.currentDocumentHtml = ''
        setPreviewStatus('Preview failed')
        setError('Failed to generate document preview. Please try again.')
        return false
    }
}

function getDocumentRequestError() {
    const reasonType = getReasonType()

    if (!pageState.selectedResident) return 'Select a resident before generating a document.'
    if (!reasonType) return 'Select a reason for the document request.'
    if (reasonType === OTHER_REASON_VALUE && !getOtherReason()) return 'Specify the reason for the document request.'

    return ''
}

async function getDocumentHtml() {
    const port = await window.electronAPI.getApiPort()
    const documentType = elements.documentType?.value ?? DEFAULT_DOCUMENT_TYPE
    const residentId = getResidentId(pageState.selectedResident)
    const url = `http://localhost:${port}/docs/${documentType}/${residentId}`
    const response = await fetch(url)

    if (!response.ok) throw new Error(`Document request failed with ${response.status}`)

    return response.text()
}

function applyRequestReason(html) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const reason = getSelectedReasonOption()
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
    if (elements.previewFrame) elements.previewFrame.srcdoc = html
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
    const residentName = slugify(getResidentFullName(pageState.selectedResident))
    const documentName = slugify(getSelectedDocumentLabel())

    return `${documentName}-${residentName}.doc`
}

function clearPreview() {
    pageState.currentDocumentHtml = ''
    renderPreview('')
    setPreviewStatus(PREVIEW_EMPTY_STATUS)
}

function clearError() {
    setError('')
}

function setError(message) {
    if (elements.error) elements.error.textContent = message
}

function setPreviewStatus(message) {
    if (elements.previewStatus) elements.previewStatus.textContent = message
}

function getReasonType() {
    return elements.reasonType?.value ?? ''
}

function getOtherReason() {
    return elements.otherReason?.value.trim() ?? ''
}

function getSelectedReasonOption() {
    return REASON_OPTIONS[getReasonType()]
}

function updateOtherReasonState() {
    if (!elements.otherReason) return

    const needsOtherReason = getReasonType() === OTHER_REASON_VALUE
    elements.otherReason.disabled = !needsOtherReason
    elements.otherReason.required = needsOtherReason
    elements.otherReason.setAttribute('aria-disabled', String(!needsOtherReason))

    if (!needsOtherReason) {
        elements.otherReason.value = ''
    }
}

function getSelectedDocumentLabel() {
    const documentType = elements.documentType?.value ?? DEFAULT_DOCUMENT_TYPE
    return DOCUMENT_TYPES[documentType] ?? 'Document'
}

function getResidentFullName(resident) {
    const middleInitial = resident.middleName ? `${resident.middleName[0]}.` : ''
    return `${resident.lastName}, ${resident.firstName} ${middleInitial} ${resident.suffix ?? ''}`.trim()
}

function getResidentId(resident) {
    return resident?.residentId ?? resident?.ResidentId ?? resident?.id
}

function clearElement(element) {
    if (element) element.innerHTML = ''
}

function slugify(value) {
    return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
}
