import {
    addBlotterEntry,
    formatCaseNatureLabel,
    formatPartyList,
    getBlotterEntriesSorted,
    getRecentBlotterEntries,
    migrateBlotterEntries
} from './incidentStorage.js'
import { escapeHtml } from '../residents/residentFormDom.js'
import { getResidentFullName, getResidentId } from '../../shared/residentUtils.js'

let allIncidents = []
let selectedComplaints = []
let selectedRespondents = []
let incidentForm
let incidentComplainantInput
let incidentRespondentInput
let complainantResultsDiv
let respondentResultsDiv
let complainantTagsDiv
let respondentTagsDiv
let recentIncidentList
let caseRecordsSearch
let caseRecordsList
let incidentsViewRoot

export async function initIncidentsPage() {
    incidentsViewRoot = document.getElementById('incidentsView')
    incidentForm = document.getElementById('incidentForm')
    incidentComplainantInput = document.getElementById('incidentComplainant')
    incidentRespondentInput = document.getElementById('incidentRespondent')
    complainantResultsDiv = document.getElementById('complainantResults')
    respondentResultsDiv = document.getElementById('respondentResults')
    complainantTagsDiv = document.getElementById('complainantTags')
    respondentTagsDiv = document.getElementById('respondentTags')
    recentIncidentList = document.getElementById('recentIncidentList')
    caseRecordsSearch = document.getElementById('caseRecordsSearch')
    caseRecordsList = document.getElementById('caseRecordsList')

    if (!incidentsViewRoot || !incidentForm) return

    selectedComplaints = []
    selectedRespondents = []

    migrateBlotterEntries()
    bindIncidentPageEvents()
    loadRecentIncidents()
}

function bindIncidentPageEvents() {
    const tabBar = incidentsViewRoot?.querySelector('.incident-tabs')
    tabBar?.addEventListener('click', (event) => {
        const tabBtn = event.target.closest('.incident-tab-btn')
        if (!tabBtn?.dataset.tab) return
        switchTab(tabBtn.dataset.tab)
    })

    incidentComplainantInput.addEventListener('input', (e) => {
        searchResidents(e.target.value, complainantResultsDiv, true)
    })

    incidentRespondentInput.addEventListener('input', (e) => {
        searchResidents(e.target.value, respondentResultsDiv, false)
    })

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideDropdown(complainantResultsDiv)
            hideDropdown(respondentResultsDiv)
        }
    })

    incidentForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        await submitIncidentForm()
    })

    caseRecordsSearch?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase()
        const filtered = allIncidents.filter(incident =>
            formatPartyList(incident.complainants).toLowerCase().includes(query) ||
            formatPartyList(incident.respondents).toLowerCase().includes(query) ||
            incident.location.toLowerCase().includes(query)
        )
        renderCaseRecords(filtered)
    })
}

function switchTab(tabName) {
    if (!incidentsViewRoot || !tabName) return

    incidentsViewRoot.querySelectorAll('.incident-tab-content').forEach(tab => {
        tab.classList.remove('active')
    })

    incidentsViewRoot.querySelectorAll('.incident-tab-btn').forEach(btn => {
        btn.classList.remove('active')
    })

    const tabElement = document.getElementById(tabName)
    const activeBtn = incidentsViewRoot.querySelector(`.incident-tab-btn[data-tab="${tabName}"]`)

    tabElement?.classList.add('active')
    activeBtn?.classList.add('active')

    if (tabName === 'case-records') {
        loadCaseRecords()
    }
}

function debounce(func, delay) {
    let timeoutId
    return function (...args) {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => func(...args), delay)
    }
}

function hideDropdown(resultsDiv) {
    if (resultsDiv) resultsDiv.classList.add('is-hidden')
}

function showDropdown(resultsDiv) {
    if (resultsDiv) resultsDiv.classList.remove('is-hidden')
}

const searchResidents = debounce(async (query, resultsDiv, isComplainant) => {
    if (!query.trim()) {
        hideDropdown(resultsDiv)
        return
    }

    showDropdown(resultsDiv)
    resultsDiv.innerHTML = '<div class="search-loading">Searching…</div>'

    try {
        const response = await window.electronAPI.postData('/residents/search', {
            query: query
        })

        if (response.success && response.data) {
            const residents = response.data

            if (residents.length === 0) {
                resultsDiv.innerHTML = '<div class="search-no-results">No residents found</div>'
                return
            }

            resultsDiv.innerHTML = residents.map(resident => {
                const residentId = getResidentId(resident)
                const residentName = getResidentFullName(resident, { includeSuffix: false })
                return `
                <div class="search-result-item" data-resident-id="${escapeHtml(residentId)}">
                    <strong>${escapeHtml(residentName)}</strong>
                    <small>${escapeHtml(resident.address || 'No address')}</small>
                </div>
            `
            }).join('')

            resultsDiv.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.residentId
                    const name = item.querySelector('strong')?.textContent?.trim()
                    addResidentTag(id, name, isComplainant)
                    hideDropdown(resultsDiv)
                    if (isComplainant) {
                        incidentComplainantInput.value = ''
                    } else {
                        incidentRespondentInput.value = ''
                    }
                })
            })
        }
    } catch (err) {
        resultsDiv.innerHTML = `<div class="search-error">Error: ${err.message}</div>`
    }
}, 300)

function addResidentTag(id, name, isComplainant) {
    const tagsDiv = isComplainant ? complainantTagsDiv : respondentTagsDiv
    const selectedArray = isComplainant ? selectedComplaints : selectedRespondents

    if (selectedArray.some(r => r.id === id)) return

    selectedArray.push({ id, name })

    const tag = document.createElement('div')
    tag.className = 'incident-tag'
    tag.innerHTML = `
        <span>${name}</span>
        <button type="button" class="tag-remove" data-id="${id}">×</button>
    `

    tag.querySelector('.tag-remove').addEventListener('click', (e) => {
        e.preventDefault()
        tag.remove()
        const index = selectedArray.findIndex(r => r.id === id)
        if (index > -1) selectedArray.splice(index, 1)
    })

    tagsDiv.appendChild(tag)
}

async function submitIncidentForm() {
    if (selectedComplaints.length === 0) {
        alert('Please select at least one complainant')
        return
    }

    if (selectedRespondents.length === 0) {
        alert('Please select at least one respondent')
        return
    }

    const caseNature = document.querySelector('input[name="caseNature"]:checked')?.value
    if (!caseNature) {
        alert('Please select the nature of case')
        return
    }

    const formData = {
        dateTime: document.getElementById('incidentDateTime').value,
        location: document.getElementById('incidentLocation').value.trim(),
        caseNature,
        complainants: [...selectedComplaints],
        respondents: [...selectedRespondents],
        narrative: document.getElementById('incidentNarrative').value.trim()
    }

    try {
        addBlotterEntry(formData)

        alert('Blotter entry saved successfully')
        incidentForm.reset()
        selectedComplaints = []
        selectedRespondents = []
        complainantTagsDiv.innerHTML = ''
        respondentTagsDiv.innerHTML = ''
        loadRecentIncidents()
    } catch (err) {
        alert(`Failed to save: ${err.message}`)
    }
}

function loadRecentIncidents() {
    if (!recentIncidentList) return

    const incidents = getRecentBlotterEntries(5)
    allIncidents = getBlotterEntriesSorted()

    if (incidents.length === 0) {
        recentIncidentList.innerHTML = '<p class="incident-empty">No blotter entries yet.</p>'
        return
    }

    recentIncidentList.innerHTML = incidents.map(renderRecentIncidentItem).join('')
}

function loadCaseRecords() {
    allIncidents = getBlotterEntriesSorted()
    renderCaseRecords(allIncidents)
}

function renderRecentIncidentItem(incident) {
    const caseNature = incident.caseNature || 'unspecified'
    return `
        <div class="incident-recent-item">
            <div class="incident-recent-item__meta">
                <span class="incident-nature-badge ${caseNature}">${escapeHtml(formatCaseNatureLabel(caseNature))}</span>
                <small>${new Date(incident.dateTime).toLocaleDateString()}</small>
            </div>
            <div class="incident-recent-parties">
                <strong>Complainant:</strong> ${escapeHtml(formatPartyList(incident.complainants))}
            </div>
            <div class="incident-recent-parties">
                <strong>Respondent:</strong> ${escapeHtml(formatPartyList(incident.respondents))}
            </div>
            <div class="incident-recent-location">${escapeHtml(incident.location)}</div>
        </div>
    `
}

function renderCaseRecords(incidents) {
    if (!caseRecordsList) return

    if (incidents.length === 0) {
        caseRecordsList.innerHTML = '<p class="incident-empty">No case records yet.</p>'
        return
    }

    caseRecordsList.innerHTML = incidents.map(incident => {
        const caseNature = incident.caseNature || 'unspecified'
        return `
        <div class="case-record-item">
            <div class="case-record-header">
                <span class="incident-nature-badge ${caseNature}">${escapeHtml(formatCaseNatureLabel(caseNature))}</span>
                <span class="case-record-date">${new Date(incident.dateTime).toLocaleDateString()}</span>
            </div>
            <div class="case-record-parties">
                <div><strong>Complainant(s):</strong> ${escapeHtml(formatPartyList(incident.complainants))}</div>
                <div><strong>Respondent(s):</strong> ${escapeHtml(formatPartyList(incident.respondents))}</div>
            </div>
            <div class="case-record-location"><strong>Location:</strong> ${escapeHtml(incident.location)}</div>
            <div class="case-record-narrative"><strong>Summary:</strong> ${escapeHtml(incident.narrative)}</div>
        </div>
    `
    }).join('')
}
