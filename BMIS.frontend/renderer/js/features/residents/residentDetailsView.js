import { getData } from '../../core/api.js'
import {
    getCivilStatusLabel,
    getResidentFullName,
    getResidentId,
    getSectorLabel,
    getSexLabel
} from '../../shared/residentUtils.js'
import { createResidentActions } from './residentActions.js'
import { getResidentRecordStatus, isResidentArchived } from './residentBackendAdapter.js'
import { getHouseholdMemberLabel, getResidentHouseholdContext } from './residentHouseholdRecords.js'

export async function openResidentDetails(resident, options = {}) {
    const iLView = document.getElementById('iLView')
    if (!iLView) return

    iLView.innerHTML = ''

    const householdContext = await resolveHouseholdContext(resident, options)

    const detailsView = document.createElement('section')
    detailsView.className = 'entity-detail-view'
    detailsView.innerHTML = `
        <div class="subview-heading">
            <button class="back-btn" type="button">&lt; Back</button>
            <h2>Resident Details</h2>
        </div>
        <div class="entity-detail-panel">
            <div class="entity-detail-header">
                <div class="entity-detail-identity">
                    <h3>${escapeHtml(getResidentFullName(resident))}</h3>
                    <p>${escapeHtml(resident.address ?? 'No address recorded')}</p>
                    ${renderHeaderSummary(resident)}
                </div>
                <div class="entity-detail-actions"></div>
            </div>
            ${renderArchiveNotice(resident)}
            ${renderArchivedDetailsSection(resident)}
            ${renderDetailSection('Personal Information', renderPersonalFields(resident))}
            ${renderDetailSection('Contact & Household', renderContactHouseholdFields(resident, householdContext))}
            ${renderDetailSection('Employment & Education', renderEmploymentFields(resident))}
            ${renderDetailSection('Record & Verification', renderRecordFields(resident))}
            ${renderMetadataFooter(resident)}
        </div>
    `

    detailsView.querySelector('.back-btn').addEventListener('click', () => options.showResidentsView?.())
    detailsView.querySelector('.entity-detail-actions').appendChild(createResidentActions(resident, options, {
        includeView: false
    }))
    wireCopyIdButton(detailsView, resident)

    iLView.appendChild(detailsView)
}

function renderHeaderSummary(resident) {
    const parts = []
    const age = getAgeFromBirthDate(resident.birthDate)

    parts.push(escapeHtml(getSexLabel(resident.sex)))
    if (age !== null) parts.push(`${age} yrs old`)
    parts.push(escapeHtml(getCivilStatusDetails(resident)))

    const meta = parts.map((part, index) => {
        const separator = index > 0
            ? '<span class="entity-detail-summary-separator" aria-hidden="true">·</span>'
            : ''
        return `${separator}<span>${part}</span>`
    }).join('')

    const sectorBadge = renderSectorBadge(resident.sector)

    return `
        <div class="entity-detail-summary">
            ${renderRecordStatusBadge(resident)}
            ${sectorBadge}
            <div class="entity-detail-summary-meta">${meta}</div>
        </div>
    `
}

function renderRecordStatusBadge(resident) {
    const archived = isResidentArchived(resident)
    const className = archived ? 'resident-record-badge--archived' : 'resident-record-badge--active'
    const label = escapeHtml(getResidentRecordStatus(resident))
    const title = archived
        ? 'Record retained and marked archived on this device.'
        : 'Resident record is active.'

    return `<span class="resident-record-badge ${className}" title="${title}">${label}</span>`
}

function renderSectorBadge(sector) {
    if (sector !== 1 && sector !== 2) return ''

    const className = sector === 1 ? 'resident-sector-badge--pwd' : 'resident-sector-badge--senior'

    return `<span class="resident-sector-badge ${className}">${escapeHtml(getSectorLabel(sector))}</span>`
}

function renderArchiveNotice(resident) {
    if (!isResidentArchived(resident)) return ''

    return `<p class="entity-detail-notice">This resident record is retained and marked archived on this device. It has not been removed from backend records.</p>`
}

function renderArchivedDetailsSection(resident) {
    if (!isResidentArchived(resident)) return ''

    return renderDetailSection('Archived Record', `
        <dl class="entity-detail-grid entity-detail-grid--section">
            ${renderDetailField('Archived On', formatArchiveDate(resident.archivedAt))}
            ${renderDetailField('Archived By', resident.archivedBy)}
            ${renderDetailField('Reason', resident.archiveReason, { fullWidth: true })}
        </dl>
    `)
}

function renderPersonalFields(resident) {
    const age = getAgeFromBirthDate(resident.birthDate)
    const birthdateDisplay = formatBirthDate(resident.birthDate)
    const birthdateValue = age !== null && birthdateDisplay
        ? `${birthdateDisplay} (${age} yrs old)`
        : birthdateDisplay

    return `
        <dl class="entity-detail-grid entity-detail-grid--section">
            ${renderDetailField('Birthdate', birthdateValue)}
            ${renderDetailField('Place of Birth', resident.placeOfBirth)}
            ${renderDetailField('Sex', getSexLabel(resident.sex))}
            ${renderDetailField('Sector', getSectorDisplay(resident.sector))}
            ${renderDetailField('Civil Status', getCivilStatusDetails(resident))}
            ${renderDetailField('Citizenship', resident.citizenship)}
            ${renderDetailField('Religion', resident.religion)}
        </dl>
    `
}

async function resolveHouseholdContext(resident, options) {
    if (resident.householdRole === 'Head' || resident.householdRole === 'Member') {
        const residents = await loadResidentsForHouseholdLookup(options)
        return getResidentHouseholdContext(resident, residents) ?? buildExplicitHouseholdContext(resident)
    }

    const residents = await loadResidentsForHouseholdLookup(options)
    return getResidentHouseholdContext(resident, residents)
}

async function loadResidentsForHouseholdLookup(options) {
    if (typeof options.getAllResidents === 'function') {
        const residents = await options.getAllResidents()
        return Array.isArray(residents) ? residents : []
    }

    const result = await getData('/residents')
    return result?.success && Array.isArray(result.data) ? result.data : []
}

function buildExplicitHouseholdContext(resident) {
    if (resident.householdRole === 'Head') {
        return {
            householdName: `${resident.lastName || 'Household'} Household`,
            role: 'Head',
            headName: getResidentFullName(resident),
            relationship: '',
            members: getHouseholdMemberNames(resident.householdMembers).map(name => ({ displayName: name })),
            groupingLabel: 'Recorded on resident form'
        }
    }

    if (resident.householdRole === 'Member') {
        return {
            householdName: resident.householdHeadName ? `${resident.householdHeadName} Household` : 'Household',
            role: 'Member',
            headName: resident.householdHeadName || null,
            relationship: resident.relationshipToHouseholdHead || '',
            members: [],
            groupingLabel: 'Recorded on resident form'
        }
    }

    return null
}

function renderContactHouseholdFields(resident, householdContext) {
    const contact = resident.contact || resident.email

    return `
        <dl class="entity-detail-grid entity-detail-grid--section">
            ${renderDetailField('Contact', contact)}
        </dl>
        ${renderHouseholdBlock(resident, householdContext)}
    `
}

function renderEmploymentFields(resident) {
    return `
        <dl class="entity-detail-grid entity-detail-grid--section">
            ${renderDetailField('Occupation', resident.occupation)}
            ${renderDetailField('Employer/School', resident.employerSchool)}
            ${renderDetailField('Education', resident.highestEducationalAttainment)}
        </dl>
    `
}

function renderRecordFields(resident) {
    return `
        ${renderVerificationBlock(resident)}
        ${renderDetailFieldBlock('Remarks', resident.remarks, { fullWidth: true })}
    `
}

function renderDetailSection(title, content) {
    return `
        <section class="entity-detail-section entity-detail-section-panel">
            <h3 class="entity-detail-section-title">${escapeHtml(title)}</h3>
            ${content}
        </section>
    `
}

function renderDetailField(label, value, options = {}) {
    const className = options.fullWidth ? ' entity-detail-field--full' : ''

    return `
        <div class="${className.trim()}">
            <dt>${escapeHtml(label)}</dt>
            <dd>${renderFieldValue(value)}</dd>
        </div>
    `
}

function renderDetailFieldBlock(label, value, options = {}) {
    return `
        <dl class="entity-detail-grid entity-detail-grid--section">
            ${renderDetailField(label, value, options)}
        </dl>
    `
}

function renderFieldValue(value) {
    const normalized = normalizeDisplayValue(value)
    if (!normalized) return '<span class="entity-detail-empty">Not recorded</span>'

    return escapeHtml(normalized)
}

function renderHouseholdBlock(resident, householdContext) {
    if (!householdContext) {
        return `<p class="entity-detail-empty entity-detail-household-empty">Household not recorded.</p>`
    }

    const otherMembers = getHouseholdContextMemberLabels(householdContext)

    return `
        <div class="entity-detail-subsection">
            <h4 class="entity-detail-subsection-title">Household</h4>
            <p class="entity-detail-household-note">${escapeHtml(householdContext.groupingLabel)}</p>
            <dl class="entity-detail-grid entity-detail-grid--section">
                ${renderDetailField('Household', householdContext.householdName)}
                ${renderDetailField('Role', householdContext.role)}
                ${renderDetailField('Household Head', householdContext.headName)}
                ${householdContext.role === 'Member'
                    ? renderDetailField('Relationship', householdContext.relationship)
                    : renderDetailField('Members', otherMembers.length ? String(otherMembers.length) : null)
                }
            </dl>
            ${otherMembers.length
                ? `<ul class="entity-detail-list">${otherMembers.map(name => `<li>${escapeHtml(name)}</li>`).join('')}</ul>`
                : (householdContext.role === 'Head'
                    ? '<p class="entity-detail-empty">No other members in this household.</p>'
                    : '')
            }
        </div>
    `
}

function getHouseholdContextMemberLabels(householdContext) {
    if (!Array.isArray(householdContext.members)) return []

    return householdContext.members.map(member => {
        if (typeof member === 'string') return member
        if (member.displayName) return member.displayName
        return getHouseholdMemberLabel(member)
    })
}

function renderVerificationBlock(resident) {
    if (!resident.proofType && !resident.proofId) {
        return `<p class="entity-detail-empty">Verification not required or recorded.</p>`
    }

    return `
        <dl class="entity-detail-grid entity-detail-grid--section">
            ${renderDetailField('Status', resident.verificationStatus || 'Pending')}
            ${renderDetailField('Proof Type', resident.proofType)}
            ${renderDetailField('Proof ID', resident.proofId)}
            ${renderDetailField('Verified By', resident.verifiedBy)}
            ${renderDetailField('Verified On', formatVerificationDate(resident.verifiedAt))}
        </dl>
    `
}

function renderMetadataFooter(resident) {
    const residentId = getResidentId(resident)
    if (!residentId) return ''

    const fullId = String(residentId)

    return `
        <footer class="entity-detail-metadata">
            <span class="entity-detail-metadata-label">Record ID</span>
            <div class="entity-detail-metadata-actions">
                <code class="entity-detail-metadata-id" title="${escapeHtml(fullId)}">${escapeHtml(truncateId(fullId))}</code>
                <button class="entity-detail-copy-btn" type="button" data-copy-resident-id>Copy ID</button>
            </div>
        </footer>
    `
}

function wireCopyIdButton(detailsView, resident) {
    const copyBtn = detailsView.querySelector('[data-copy-resident-id]')
    const residentId = getResidentId(resident)
    if (!copyBtn || !residentId) return

    copyBtn.addEventListener('click', async () => {
        const originalLabel = copyBtn.textContent

        try {
            await navigator.clipboard.writeText(String(residentId))
            copyBtn.textContent = 'Copied'
        } catch {
            copyBtn.textContent = 'Copy failed'
        }

        window.setTimeout(() => {
            copyBtn.textContent = originalLabel
        }, 2000)
    })
}

function getHouseholdMemberNames(value) {
    return String(value ?? '')
        .split(';')
        .map(name => name.trim())
        .filter(Boolean)
}

function getCivilStatusDetails(resident) {
    if (resident.civilStatus === 6 && resident.civilStatusOther) {
        return `Other: ${resident.civilStatusOther}`
    }

    return getCivilStatusLabel(resident.civilStatus)
}

function getSectorDisplay(sector) {
    if (sector === 0 || sector === undefined || sector === null) return null
    return getSectorLabel(sector)
}

function getAgeFromBirthDate(birthDate) {
    if (!birthDate) return null

    const date = new Date(birthDate)
    if (Number.isNaN(date.getTime())) return null

    const today = new Date()
    let age = today.getFullYear() - date.getFullYear()
    const birthdayHasPassed = (
        today.getMonth() > date.getMonth()
        || (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate())
    )

    if (!birthdayHasPassed) age -= 1
    return age >= 0 ? age : null
}

function formatBirthDate(value) {
    if (!value) return null

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return normalizeDisplayValue(value)

    return date.toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

function formatArchiveDate(value) {
    if (!value) return null
    return formatDate(value)
}

function formatVerificationDate(value) {
    if (!value) return null

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return normalizeDisplayValue(value)

    return formatDate(value)
}

function formatDate(value) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return normalizeDisplayValue(value)

    return date.toLocaleString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    })
}

function truncateId(value) {
    const id = String(value)
    if (id.length <= 16) return id

    return `${id.slice(0, 8)}…${id.slice(-4)}`
}

function normalizeDisplayValue(value) {
    const normalized = String(value ?? '').trim()
    if (!normalized || ['none', 'not recorded', 'not specified', 'not available'].includes(normalized.toLowerCase())) {
        return ''
    }

    return normalized
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
