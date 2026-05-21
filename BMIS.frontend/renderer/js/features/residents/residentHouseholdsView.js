import { getData } from '../../core/api.js'
import { getMemberCountLabel } from '../households/householdFormatters.js'
import { clearElement, createActionButton, createEmptyMessage } from '../households/householdDom.js'
import { escapeHtml } from './residentFormDom.js'
import { getHouseholdMemberLabel, getHouseholdsFromResidents } from './residentHouseholdRecords.js'

const state = {
    households: [],
    selectedHousehold: null,
    hasLoaded: false
}

let elements = {}

export function initResidentHouseholdsView() {
    elements = getElements()
    state.households = []
    state.selectedHousehold = null
    state.hasLoaded = false
    bindTabControls()
    bindHouseholdControls()
}

function getElements() {
    return {
        residentTab: document.getElementById('residentRecordsTab'),
        householdsTab: document.getElementById('residentHouseholdsTab'),
        residentPanel: document.getElementById('residentRecordsPanel'),
        householdsPanel: document.getElementById('residentHouseholdsPanel'),
        residentToolbar: document.getElementById('iLNav'),
        residentStatus: document.getElementById('residentImportStatus'),
        residentActionBarMount: document.getElementById('residentActionBarMount'),
        householdsToolbar: document.getElementById('residentHouseholdsToolbar'),
        householdActionBar: document.getElementById('householdActionBar'),
        householdSearch: document.getElementById('householdSearch'),
        householdsList: document.getElementById('householdsList'),
        detailsView: document.getElementById('householdDetailsView'),
        detailsBackBtn: document.getElementById('householdDetailsBackBtn'),
        detailsContent: document.getElementById('householdDetailsContent')
    }
}

function bindTabControls() {
    elements.residentTab?.addEventListener('click', showResidentRecords)
    elements.householdsTab?.addEventListener('click', showHouseholds)
}

function bindHouseholdControls() {
    elements.householdSearch?.addEventListener('input', renderHouseholds)
    elements.detailsBackBtn?.addEventListener('click', showHouseholdsList)
}

function showResidentRecords() {
    setActiveTab('residents')
    elements.residentPanel.hidden = false
    elements.householdsPanel.hidden = true
    elements.detailsView.hidden = true
    elements.residentToolbar.hidden = false
    elements.residentStatus.hidden = false
    elements.residentActionBarMount.hidden = false
    elements.householdsToolbar.hidden = true
    elements.householdActionBar.hidden = true
}

async function showHouseholds() {
    setActiveTab('households')
    elements.residentPanel.hidden = true
    elements.householdsPanel.hidden = false
    elements.detailsView.hidden = true
    elements.residentToolbar.hidden = true
    elements.residentStatus.hidden = true
    elements.residentActionBarMount.hidden = true
    elements.householdsToolbar.hidden = false

    if (!state.hasLoaded) await loadHouseholds()
    renderHouseholds()
}

function setActiveTab(activeTab) {
    const isResidents = activeTab === 'residents'

    elements.residentTab?.classList.toggle('active', isResidents)
    elements.householdsTab?.classList.toggle('active', !isResidents)
    elements.residentTab?.setAttribute('aria-selected', String(isResidents))
    elements.householdsTab?.setAttribute('aria-selected', String(!isResidents))
}

async function loadHouseholds() {
    const result = await getData('/residents')
    const residents = result?.success && Array.isArray(result.data) ? result.data : []

    state.households = getHouseholdsFromResidents(residents)
    state.hasLoaded = true
}

function renderHouseholds() {
    if (!elements.householdsList) return

    const households = getFilteredHouseholds()
    state.selectedHousehold = null
    clearElement(elements.householdsList)
    renderHouseholdActionBar()

    if (households.length === 0) {
        elements.householdsList.appendChild(createEmptyMessage('No households found.', 'households-empty'))
        return
    }

    households.forEach(household => elements.householdsList.appendChild(createHouseholdRow(household)))
}

function getFilteredHouseholds() {
    const query = elements.householdSearch?.value.trim().toLowerCase() ?? ''
    if (!query) return state.households

    return state.households.filter(household => (
        household.name.toLowerCase().includes(query) ||
        household.head.toLowerCase().includes(query) ||
        household.address.toLowerCase().includes(query) ||
        household.members.some(member => getHouseholdMemberLabel(member).toLowerCase().includes(query))
    ))
}

function createHouseholdRow(household) {
    const row = document.createElement('div')
    const householdInfo = document.createElement('span')
    const name = document.createElement('strong')
    const address = document.createElement('small')
    const head = document.createElement('span')
    const members = document.createElement('span')

    row.className = 'household-row'
    row.tabIndex = 0
    row.addEventListener('click', () => selectHouseholdRow(row, household))
    row.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return

        event.preventDefault()
        selectHouseholdRow(row, household)
    })

    name.textContent = household.name
    address.textContent = household.address || 'No address recorded'
    householdInfo.className = 'household-row-main'
    householdInfo.append(name, address)

    head.textContent = household.head || 'Not specified'
    members.textContent = getMemberCountLabel(household.memberCount)

    row.append(householdInfo, head, members)
    return row
}

function selectHouseholdRow(row, household) {
    state.selectedHousehold = household
    document.querySelectorAll('.household-row.is-selected').forEach(item => item.classList.remove('is-selected'))
    row.classList.add('is-selected')
    renderHouseholdActionBar()
}

function renderHouseholdActionBar() {
    if (!elements.householdActionBar) return

    clearElement(elements.householdActionBar)
    elements.householdActionBar.hidden = !state.selectedHousehold
    if (!state.selectedHousehold) return

    const label = document.createElement('span')
    label.className = 'entity-selection-label'
    label.textContent = `Selected household: ${state.selectedHousehold.name}`

    const actions = document.createElement('div')
    actions.className = 'entity-row-actions'
    actions.append(createActionButton('View', 'entity-action-btn', () => showHouseholdDetails(state.selectedHousehold)))

    elements.householdActionBar.append(label, actions)
}

function showHouseholdDetails(household) {
    if (!elements.detailsContent) return

    elements.householdsPanel.hidden = true
    elements.detailsView.hidden = false
    elements.householdActionBar.hidden = true
    elements.detailsContent.innerHTML = getHouseholdDetailsHtml(household)
}

function showHouseholdsList() {
    elements.detailsView.hidden = true
    elements.householdsPanel.hidden = false
    renderHouseholds()
}

function getHouseholdDetailsHtml(household) {
    const memberList = household.members.length
        ? household.members.map(member => `<li>${escapeHtml(getHouseholdMemberLabel(member))}</li>`).join('')
        : '<li>No members recorded.</li>'

    return `
        <div class="entity-detail-header">
            <div>
                <h3>${escapeHtml(household.name)}</h3>
                <p>${escapeHtml(household.address || 'No address recorded')}</p>
            </div>
        </div>
        <dl class="entity-detail-grid">
            <div><dt>Household Head</dt><dd>${escapeHtml(household.head || 'Not specified')}</dd></div>
            <div><dt>Members</dt><dd>${escapeHtml(String(household.memberCount ?? 0))}</dd></div>
            <div><dt>Record Type</dt><dd>Resident record group</dd></div>
        </dl>
        <div class="entity-detail-section">
            <h3>Household Members</h3>
            <ul class="entity-detail-list">${memberList}</ul>
        </div>
    `
}
