import { DEFAULT_DOCUMENT_TYPE, DOCUMENT_TYPES, OTHER_REASON_VALUE, PREVIEW_EMPTY_STATUS } from './documentRequestConstants.js'
import { clearElement, getDocumentRequestElements, renderPreview, setError, setPreviewStatus } from './documentRequestDom.js'
import { getResidentFullName } from './documentRequestFormatters.js'
import { applyRequestReason, downloadWordDocument, fetchDocumentHtml, getDocumentFileName } from './documentRequestGenerator.js'
import { findResidents, renderSearchMessage, renderSearchResults } from './documentRequestResidents.js'
import { getDocumentDefaults } from '../settings/documentDefaults.js'
import { isResidentArchived } from '../residents/residentBackendAdapter.js'

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

function bindSearchControls() {
    elements.searchBtn?.addEventListener('click', searchResidents)
    elements.clearSearchBtn?.addEventListener('click', clearResidentSearch)
    elements.searchInput?.addEventListener('input', updateClearSearchButton)
    elements.searchInput?.addEventListener('keydown', handleSearchKeydown)

    updateClearSearchButton()
}

function bindDocumentControls() {
    elements.previewBtn?.addEventListener('click', previewDocument)
    elements.documentType?.addEventListener('change', handleDocumentTypeChange)
    elements.reasonType?.addEventListener('change', handleReasonChange)
    elements.otherReason?.addEventListener('input', clearPreview)
    elements.form?.addEventListener('submit', handleDocumentSubmit)

    updateReasonControls()
}

function handleSearchKeydown(event) {
    if (event.key !== 'Enter') return

    event.preventDefault()
    searchResidents()
}

function handleReasonChange() {
    updateReasonControls()
    clearPreview()
}

function handleDocumentTypeChange() {
    updateReasonControls()
    clearPreview()
}

async function handleDocumentSubmit(event) {
    event.preventDefault()

    const isReady = pageState.currentDocumentHtml || await previewDocument()
    if (!isReady) return

    try {
        await downloadWordDocument(pageState.currentDocumentHtml, getCurrentDocumentFileName(), getDocumentExportContext())
        try {
            await sendReadyForPickupNotification()
        }
        catch (notificationError) {
            console.error(notificationError)
            setPagePreviewStatus(`${getSelectedDocumentLabel()} saved. Email notification was not sent.`)
        }
    }
    catch (error) {
        console.error(error)
        setPageError('Failed to save document. Please try again.')
    }
}

async function sendReadyForPickupNotification() {
    const email = pageState.selectedResident?.email
    if (!email) {
        setPagePreviewStatus(`${getSelectedDocumentLabel()} saved. No resident email is recorded.`)
        return
    }

    const result = await window.electronAPI.sendDocumentReadyEmail({
        email,
        residentName: getResidentFullName(pageState.selectedResident),
        documentLabel: getSelectedDocumentLabel()
    })

    setPagePreviewStatus(
        result?.success
            ? `${getSelectedDocumentLabel()} saved. Email notification opened.`
            : `${getSelectedDocumentLabel()} saved. ${result?.message ?? 'Email notification was not sent.'}`
    )
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
        renderSearchMessage(elements, 'Enter a resident name to search.')
        return
    }

    renderSearchMessage(elements, 'Searching...')

    const residents = await findResidents(query)
    renderSearchResults(elements, residents, (resident) => {
        setSelectedResident(resident)
        clearElement(elements.resultsContainer)
    })
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
    elements.selectedContainer.textContent = isResidentArchived(resident)
        ? `Selected: ${getResidentFullName(resident)} (archived record)`
        : `Selected: ${getResidentFullName(resident)}`
}

async function previewDocument() {
    clearError()

    const validationError = getDocumentRequestError()
    if (validationError) {
        setPageError(validationError)
        return false
    }

    setPagePreviewStatus('Generating preview...')

    try {
        const html = await fetchDocumentHtml({
            documentType: getDocumentType(),
            resident: pageState.selectedResident
        })
        pageState.currentDocumentHtml = applyRequestReason(html, {
            reasonType: getReasonType(),
            otherReason: getOtherReason(),
            shouldApplyReason: documentUsesReason()
        })
        renderPreview(elements, pageState.currentDocumentHtml)
        setPagePreviewStatus(`${getSelectedDocumentLabel()} ready`)
        return true
    }
    catch (error) {
        console.error(error)
        pageState.currentDocumentHtml = ''
        setPagePreviewStatus('Preview failed')
        setPageError('Failed to generate document preview. Please try again.')
        return false
    }
}

function getDocumentRequestError() {
    const reasonType = getReasonType()

    if (!pageState.selectedResident) return 'Select a resident before generating a document.'
    if (isResidentArchived(pageState.selectedResident)) return 'Archived resident records are retained for reference and cannot be used for new document requests.'
    if (!documentUsesReason()) return ''
    if (!reasonType) return 'Select a reason for the document request.'
    if (reasonType === OTHER_REASON_VALUE && !getOtherReason()) return 'Specify the reason for the document request.'

    return ''
}

function clearPreview() {
    pageState.currentDocumentHtml = ''
    renderPreview(elements, '')
    setPagePreviewStatus(PREVIEW_EMPTY_STATUS)
}

function clearError() {
    setPageError('')
}

function setPageError(message) {
    setError(elements, message)
}

function setPagePreviewStatus(message) {
    setPreviewStatus(elements, message)
}

function getDocumentType() {
    return elements.documentType?.value ?? DEFAULT_DOCUMENT_TYPE
}

function getReasonType() {
    return documentUsesReason() ? elements.reasonType?.value ?? '' : ''
}

function getOtherReason() {
    return elements.otherReason?.value.trim() ?? ''
}

function getDocumentExportContext() {
    const documentType = getDocumentType()
    const context = {
        resident: pageState.selectedResident,
        documentDefaults: getDocumentDefaults()
    }

    if (documentType === '1') {
        context.documentType = documentType
    }

    if (documentUsesReason()) {
        context.documentType = documentType
        context.reasonType = getReasonType()
        context.otherReason = getOtherReason()
    }

    return context
}

function documentUsesReason() {
    return getDocumentType() === '2'
}

function updateReasonControls() {
    const usesReason = documentUsesReason()

    if (elements.reasonGroup) elements.reasonGroup.hidden = !usesReason
    if (elements.reasonType) {
        elements.reasonType.disabled = !usesReason
        elements.reasonType.required = usesReason
        elements.reasonType.setAttribute('aria-disabled', String(!usesReason))

        if (!usesReason) elements.reasonType.value = ''
    }

    if (!elements.otherReason) return

    const needsOtherReason = usesReason && getReasonType() === OTHER_REASON_VALUE
    elements.otherReason.disabled = !needsOtherReason
    elements.otherReason.required = needsOtherReason
    elements.otherReason.setAttribute('aria-disabled', String(!needsOtherReason))

    if (!needsOtherReason) {
        elements.otherReason.value = ''
    }
}

function getSelectedDocumentLabel() {
    return DOCUMENT_TYPES[getDocumentType()] ?? 'Document'
}

function getCurrentDocumentFileName() {
    return getDocumentFileName({
        resident: pageState.selectedResident,
        documentLabel: getSelectedDocumentLabel()
    })
}
