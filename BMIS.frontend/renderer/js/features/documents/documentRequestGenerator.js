import { OTHER_REASON_VALUE, REASON_OPTIONS } from './documentRequestConstants.js'
import { getResidentFullName, getResidentId, slugify } from './documentRequestFormatters.js'

export async function fetchDocumentHtml({ documentType, resident }) {
    const port = await window.electronAPI.getApiPort()
    const residentId = getResidentId(resident)
    const url = `http://localhost:${port}/docs/${documentType}/${residentId}`
    const response = await fetch(url)

    if (!response.ok) throw new Error(`Document request failed with ${response.status}`)

    return response.text()
}

export function applyRequestReason(html, { reasonType, otherReason }) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const reason = REASON_OPTIONS[reasonType]
    const othersReason = doc.getElementById('option-others-reason')

    reason?.checkboxIds.forEach((checkboxId) => {
        const checkbox = doc.getElementById(checkboxId)
        if (!checkbox) return

        if (checkbox.tagName === 'INPUT') {
            checkbox.setAttribute('checked', 'checked')
            return
        }

        checkbox.textContent = 'X'
        checkbox.classList.add('is-checked')
    })

    if (othersReason && reasonType === OTHER_REASON_VALUE) {
        if (othersReason.tagName === 'INPUT') {
            othersReason.setAttribute('value', otherReason)
        }
        else {
            othersReason.textContent = otherReason
        }
    }

    return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`
}

export async function downloadWordDocument(html, fileName, context = {}) {
    const result = await window.electronAPI.saveWordDocument(html, fileName, context)
    if (!result?.success && !result?.canceled) {
        throw new Error(result?.message ?? 'Failed to save Word document.')
    }
}

export function getDocumentFileName({ resident, documentLabel }) {
    const residentName = slugify(getResidentFullName(resident))
    const documentName = slugify(documentLabel)

    return `${documentName}-${residentName}.docx`
}
