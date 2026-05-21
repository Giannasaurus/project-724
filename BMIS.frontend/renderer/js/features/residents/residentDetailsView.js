import {
    getCivilStatusLabel,
    getResidentFullName,
    getResidentId,
    getSectorLabel,
    getSexLabel
} from '../../shared/residentUtils.js'
import { createResidentActions } from './residentActions.js'

export function openResidentDetails(resident, options = {}) {
    const iLView = document.getElementById('iLView')
    if (!iLView) return

    const deleteDialog = document.getElementById('deleteConfirmDialog')
    iLView.innerHTML = ''

    const detailsView = document.createElement('section')
    detailsView.className = 'entity-detail-view'
    detailsView.innerHTML = `
        <div class="subview-heading">
            <button class="back-btn" type="button">&lt; Back</button>
            <h2>Resident Details</h2>
        </div>
        <div class="entity-detail-panel">
            <div class="entity-detail-header">
                <div>
                    <h3>${escapeHtml(getResidentFullName(resident))}</h3>
                    <p>${escapeHtml(resident.address ?? 'No address recorded')}</p>
                </div>
                <div class="entity-detail-actions"></div>
            </div>
            <dl class="entity-detail-grid">
                <div><dt>Birthdate</dt><dd>${escapeHtml(resident.birthDate ?? 'Not specified')}</dd></div>
                <div><dt>Place of Birth</dt><dd>${escapeHtml(resident.placeOfBirth || 'Not recorded')}</dd></div>
                <div><dt>Sex</dt><dd>${escapeHtml(getSexLabel(resident.sex))}</dd></div>
                <div><dt>Sector</dt><dd>${escapeHtml(getSectorLabel(resident.sector))}</dd></div>
                <div><dt>Civil Status</dt><dd>${escapeHtml(getCivilStatusDetails(resident))}</dd></div>
                <div><dt>Citizenship</dt><dd>${escapeHtml(resident.citizenship || 'Not recorded')}</dd></div>
                <div><dt>Religion</dt><dd>${escapeHtml(resident.religion || 'Not recorded')}</dd></div>
                <div><dt>Contact</dt><dd>${escapeHtml(resident.contact || resident.email || 'Not recorded')}</dd></div>
                <div><dt>Household</dt><dd>${escapeHtml(getHouseholdDetails(resident))}</dd></div>
                <div><dt>Occupation</dt><dd>${escapeHtml(resident.occupation || 'Not recorded')}</dd></div>
                <div><dt>Employer/School</dt><dd>${escapeHtml(resident.employerSchool || 'Not recorded')}</dd></div>
                <div><dt>Education</dt><dd>${escapeHtml(resident.highestEducationalAttainment || 'Not recorded')}</dd></div>
                <div><dt>Remarks</dt><dd>${escapeHtml(resident.remarks || 'None')}</dd></div>
                <div><dt>Proof ID</dt><dd>${escapeHtml(resident.proofId || 'Not required/recorded')}</dd></div>
                <div><dt>Resident ID</dt><dd>${escapeHtml(String(getResidentId(resident) ?? 'Not available'))}</dd></div>
            </dl>
        </div>
    `

    detailsView.querySelector('.back-btn').addEventListener('click', () => options.showResidentsView?.())
    detailsView.querySelector('.entity-detail-actions').appendChild(createResidentActions(resident, options, {
        includeView: false
    }))
    iLView.appendChild(detailsView)
    if (deleteDialog) iLView.appendChild(deleteDialog)
}

function getHouseholdDetails(resident) {
    if (resident.householdRole === 'Head') return `Head; members: ${resident.householdMembers || 'pending / add linked members'}`
    if (resident.householdRole === 'Member') {
        const relationship = resident.relationshipToHouseholdHead
            ? `; relationship: ${resident.relationshipToHouseholdHead}`
            : ''
        return `Member; head: ${resident.householdHeadName || 'not recorded'}${relationship}`
    }
    return 'Not recorded'
}

function getCivilStatusDetails(resident) {
    if (resident.civilStatus === 6 && resident.civilStatusOther) {
        return `Other: ${resident.civilStatusOther}`
    }

    return getCivilStatusLabel(resident.civilStatus)
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[char])
}
