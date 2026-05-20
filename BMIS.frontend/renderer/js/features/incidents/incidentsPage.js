import { getResidentFullName } from '../../shared/residentUtils.js'
import { searchResidentsByName } from '../residents/residentSearch.js'

const INCIDENTS_KEY = 'bmisIncidentCases'

let verifiedRespondent = null

export function initIncidentsPage() {
    verifiedRespondent = null
    bindIncidentControls()
    renderIncidentList()
}

function bindIncidentControls() {
    const form = document.getElementById('incidentForm')
    const verifyBtn = document.getElementById('verifyRespondentBtn')
    const clearBtn = document.getElementById('clearIncidentFormBtn')

    verifyBtn?.addEventListener('click', verifyRespondentResident)
    clearBtn?.addEventListener('click', clearIncidentForm)
    form?.addEventListener('submit', saveIncidentCase)
}

async function verifyRespondentResident() {
    const respondentInput = document.getElementById('incidentRespondent')
    const respondentName = respondentInput?.value.trim() ?? ''

    verifiedRespondent = null
    setIncidentStatus('')

    if (!respondentName) {
        setIncidentStatus('Enter the complained resident before verification.')
        return
    }

    const result = await searchResidentsByName(respondentName, { from: 0, limit: 5 })
    const residents = Array.isArray(result?.data) ? result.data : []
    const match = residents.find(resident =>
        getResidentFullName(resident).toLowerCase().includes(respondentName.toLowerCase()) ||
        respondentName.toLowerCase().includes(getResidentFullName(resident).toLowerCase())
    )

    if (!match) {
        setIncidentStatus('Respondent was not found in resident records. Verify residency before proceeding.')
        return
    }

    verifiedRespondent = match
    if (respondentInput) respondentInput.value = getResidentFullName(match)
    setInputValue('incidentRespondentEmail', match.email ?? '')
    setIncidentStatus(`Verified resident: ${getResidentFullName(match)}.`)
}

async function saveIncidentCase(event) {
    event.preventDefault()

    const values = getIncidentFormValues()
    const validationError = getIncidentValidationError(values)
    if (validationError) {
        setIncidentStatus(validationError)
        return
    }

    const incident = {
        id: crypto.randomUUID(),
        status: values.resolution ? 'Resolved' : values.hearingSchedule ? 'For hearing' : 'Filed',
        createdAt: new Date().toISOString(),
        respondentResidentName: getResidentFullName(verifiedRespondent),
        ...values
    }
    const incidents = getIncidentCases()

    incidents.unshift(incident)
    localStorage.setItem(INCIDENTS_KEY, JSON.stringify(incidents))
    renderIncidentList()
    clearIncidentForm()
    setIncidentStatus('Case saved. Notification opened for involved parties with email addresses.')
    await notifyIncidentParties(incident)
}

function getIncidentValidationError(values) {
    if (!values.complainant || !values.respondent || !values.location || !values.narrative) {
        return 'Complainant, respondent, location, and narrative are required.'
    }

    if (!verifiedRespondent) {
        return 'Verify that the complained person is a barangay resident before saving the complaint.'
    }

    return ''
}

function getIncidentFormValues() {
    return {
        complainant: getInputValue('incidentComplainant'),
        complainantEmail: getInputValue('incidentComplainantEmail'),
        respondent: getInputValue('incidentRespondent'),
        respondentEmail: getInputValue('incidentRespondentEmail'),
        location: getInputValue('incidentLocation'),
        hearingSchedule: getInputValue('incidentHearingSchedule'),
        narrative: getInputValue('incidentNarrative'),
        action: getInputValue('incidentAction'),
        resolution: getInputValue('incidentResolution')
    }
}

function renderIncidentList() {
    const container = document.getElementById('incidentList')
    if (!container) return

    const incidents = getIncidentCases()
    if (incidents.length === 0) {
        container.innerHTML = '<p class="incident-empty">No blotter or case records yet.</p>'
        return
    }

    container.innerHTML = ''
    incidents.forEach((incident) => {
        const item = document.createElement('article')
        item.className = 'incident-item'
        item.innerHTML = `
            <div>
                <h4>${escapeHtml(incident.complainant)} vs ${escapeHtml(incident.respondent)}</h4>
                <p>${escapeHtml(incident.location)} · ${escapeHtml(formatDateTime(incident.createdAt))}</p>
            </div>
            <span>${escapeHtml(incident.status)}</span>
            <dl>
                <div><dt>Action</dt><dd>${escapeHtml(incident.action || 'Pending')}</dd></div>
                <div><dt>Hearing</dt><dd>${escapeHtml(incident.hearingSchedule || 'Not scheduled')}</dd></div>
                <div><dt>Resolution</dt><dd>${escapeHtml(incident.resolution || 'Pending')}</dd></div>
            </dl>
        `
        container.appendChild(item)
    })
}

function getIncidentCases() {
    try {
        const incidents = JSON.parse(localStorage.getItem(INCIDENTS_KEY) ?? '[]')
        return Array.isArray(incidents) ? incidents : []
    }
    catch {
        return []
    }
}

async function notifyIncidentParties(incident) {
    const emails = [incident.complainantEmail, incident.respondentEmail].filter(Boolean)
    if (emails.length === 0) return

    await window.electronAPI.sendIncidentNotification({
        emails,
        subject: `Barangay case notice: ${incident.complainant} vs ${incident.respondent}`,
        message: getIncidentNotificationMessage(incident)
    })
}

function getIncidentNotificationMessage(incident) {
    return [
        `A barangay blotter/case record has been filed for ${incident.complainant} and ${incident.respondent}.`,
        `Incident location: ${incident.location}`,
        `Hearing schedule: ${incident.hearingSchedule || 'To be scheduled'}`,
        `Barangay action: ${incident.action || 'For review'}`,
        `Resolution: ${incident.resolution || 'Pending'}`
    ].join('\n')
}

function clearIncidentForm() {
    document.getElementById('incidentForm')?.reset()
    verifiedRespondent = null
}

function setIncidentStatus(message) {
    const status = document.getElementById('incidentVerificationStatus')
    if (status) status.textContent = message
}

function getInputValue(id) {
    return document.getElementById(id)?.value.trim() ?? ''
}

function setInputValue(id, value) {
    const input = document.getElementById(id)
    if (input) input.value = value
}

function formatDateTime(value) {
    return new Date(value).toLocaleString()
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
