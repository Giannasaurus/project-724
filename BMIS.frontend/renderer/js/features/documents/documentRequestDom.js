export function getDocumentRequestElements() {
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

export function clearElement(element) {
    if (element) element.innerHTML = ''
}

export function renderPreview(elements, html) {
    if (elements.previewFrame) elements.previewFrame.srcdoc = html
}

export function setError(elements, message) {
    if (elements.error) elements.error.textContent = message
}

export function setPreviewStatus(elements, message) {
    if (elements.previewStatus) elements.previewStatus.textContent = message
}
