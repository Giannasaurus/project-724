import { OTHER_REASON_VALUE, REASON_OPTIONS } from './documentRequestConstants.js'
import { DOCUMENT_TYPES } from './documentRequestConstants.js'
import { getResidentFullName, getResidentId, slugify } from './documentRequestFormatters.js'
import { getDocumentDefaults } from '../settings/documentDefaults.js'

export async function fetchDocumentHtml({ documentType, resident }) {
    if (!['0', '1', '2'].includes(String(documentType))) {
        return createGenericDocumentHtml({ documentType, resident })
    }

    const port = await window.electronAPI.getApiPort()
    const residentId = getResidentId(resident)
    const url = `http://localhost:${port}/docs/${documentType}/${residentId}`
    const response = await fetch(url)

    if (!response.ok) throw new Error(`Document request failed with ${response.status}`)

    return response.text()
}

function createGenericDocumentHtml({ documentType, resident }) {
    const defaults = getDocumentDefaults()
    const documentLabel = DOCUMENT_TYPES[documentType] ?? 'Barangay Document'
    const residentName = getResidentFullName(resident)
    const issuedDate = new Date().toLocaleDateString()

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(documentLabel)}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 48px; }
        h1, h2, p { margin: 0 0 18px; }
        .header { text-align: center; margin-bottom: 40px; }
        .body { text-align: justify; }
        .signature { margin-top: 72px; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        <h2>${escapeHtml(defaults.barangayName)} ${escapeHtml(defaults.barangayZone)}</h2>
        <p>${escapeHtml(defaults.barangayAddress)}</p>
        <h1>${escapeHtml(documentLabel)}</h1>
    </div>
    <div class="body">
        <p>This certifies that <strong>${escapeHtml(residentName)}</strong>, residing at ${escapeHtml(resident.address ?? '')}, has requested this ${escapeHtml(documentLabel.toLowerCase())} from the barangay.</p>
        <p>This document is issued on ${escapeHtml(issuedDate)} for lawful purposes, subject to verification of barangay records and applicable requirements.</p>
    </div>
    <div class="signature">
        <p><strong>${escapeHtml(defaults.chairName)}</strong></p>
        <p>${escapeHtml(defaults.chairTitle)}</p>
    </div>
</body>
</html>`
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[char])
}

export function applyRequestReason(html, { reasonType, otherReason, shouldApplyReason = true }) {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const reason = REASON_OPTIONS[reasonType]
    const othersReason = doc.getElementById('option-others-reason')

    if (shouldApplyReason) reason?.checkboxIds.forEach((checkboxId) => {
        const checkbox = doc.getElementById(checkboxId)
        if (!checkbox) return

        if (checkbox.tagName === 'INPUT') {
            checkbox.setAttribute('checked', 'checked')
            return
        }

        checkbox.textContent = 'X'
        checkbox.classList.add('is-checked')
    })

    if (shouldApplyReason && othersReason && reasonType === OTHER_REASON_VALUE) {
        if (othersReason.tagName === 'INPUT') {
            othersReason.setAttribute('value', otherReason)
        }
        else {
            othersReason.textContent = otherReason
        }
    }

    applyDocumentDefaults(doc, getDocumentDefaults())

    return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`
}

function applyDocumentDefaults(doc, defaults) {
    replaceText(doc.body, 'Barangay 724 Zone 79, District V', `${defaults.barangayName} ${defaults.barangayZone}`)
    replaceText(doc.body, 'ROLANDO V. NAVARRO', defaults.chairName)
    replaceText(doc.body, 'Punong Barangay', defaults.chairTitle)
    replaceText(doc.body, 'barangay724zone79@gmail.com', defaults.email)
    replaceText(doc.body, '2207 Singalong Street, Malate Manila', defaults.barangayAddress)
    replaceText(doc.body, 'Barangay 724 Zone 79', defaults.facebook)
}

function replaceText(root, from, to) {
    if (!root || !from || to === undefined) return

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    const nodes = []
    while (walker.nextNode()) nodes.push(walker.currentNode)

    nodes.forEach((node) => {
        node.textContent = node.textContent.replaceAll(from, to)
    })
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
