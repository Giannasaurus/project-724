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
        if (checkbox) checkbox.setAttribute('checked', 'checked')
    })

    if (othersReason && reasonType === OTHER_REASON_VALUE) {
        othersReason.setAttribute('value', otherReason)
    }

    return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`
}

export function downloadWordDocument(html, fileName) {
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    link.remove()

    URL.revokeObjectURL(url)
}

export function getDocumentFileName({ resident, documentLabel }) {
    const residentName = slugify(getResidentFullName(resident))
    const documentName = slugify(documentLabel)

    return `${documentName}-${residentName}.doc`
}
