import {
    escapeHtml,
    getMemberCountLabel,
    getResidentFullName,
    getSexLabel
} from './householdFormatters.js'

export function renderHouseholdDetailsHtml(household, options = {}) {
    const {
        members = [],
        memberNames = [],
        recordType = 'Resident record group',
        includeActions = false
    } = options

    const memberCount = household.memberCount ?? members.length ?? memberNames.length
    const actionsMarkup = includeActions ? '<div class="entity-detail-actions"></div>' : ''

    return `
        <div class="entity-detail-header">
            <div class="entity-detail-identity">
                <h3>${escapeHtml(household.name)}</h3>
                <p>${escapeHtml(household.address || 'No address recorded')}</p>
                ${renderHeaderSummary(household, memberCount, recordType)}
            </div>
            ${actionsMarkup}
        </div>
        ${renderDetailSection('Overview', renderOverviewFields(household, memberCount, recordType))}
        ${renderDetailSection('Household Members', renderMembersBlock(household, members, memberNames))}
        ${renderMetadataFooter(household)}
    `
}

export function wireHouseholdDetailsCopyButton(container, household) {
    const copyBtn = container?.querySelector('[data-copy-household-id]')
    const householdId = household?.id
    if (!copyBtn || !householdId) return

    copyBtn.addEventListener('click', async () => {
        const originalLabel = copyBtn.textContent

        try {
            await navigator.clipboard.writeText(String(householdId))
            copyBtn.textContent = 'Copied'
        } catch {
            copyBtn.textContent = 'Copy failed'
        }

        window.setTimeout(() => {
            copyBtn.textContent = originalLabel
        }, 2000)
    })
}

function renderHeaderSummary(household, memberCount, recordType) {
    const headLabel = normalizeDisplayValue(household.head)
    const headMeta = headLabel
        ? `Head: ${escapeHtml(headLabel)}`
        : '<span class="entity-detail-empty">Head not specified</span>'

    return `
        <div class="entity-detail-summary">
            <span class="household-record-badge">${escapeHtml(getMemberCountLabel(memberCount))}</span>
            ${renderRecordTypeBadge(recordType)}
            <div class="entity-detail-summary-meta">${headMeta}</div>
        </div>
    `
}

function renderRecordTypeBadge(recordType) {
    const isManual = /manual/i.test(recordType)
    const className = isManual ? 'household-record-badge--manual' : 'household-record-badge--derived'

    return `<span class="household-record-badge ${className}">${escapeHtml(recordType)}</span>`
}

function renderOverviewFields(household, memberCount, recordType) {
    return `
        <dl class="entity-detail-grid entity-detail-grid--section">
            ${renderDetailField('Household Head', household.head)}
            ${renderDetailField('Members', String(memberCount))}
            ${renderDetailField('Record Type', recordType)}
            ${renderDetailField('Address', household.address, { fullWidth: true })}
        </dl>
    `
}

function renderMembersBlock(household, members, memberNames) {
    if (members.length > 0) {
        return `<ul class="entity-detail-member-list">${members.map(member => renderMemberItem(member, household)).join('')}</ul>`
    }

    if (memberNames.length > 0) {
        return `<ul class="entity-detail-member-list">${memberNames.map(name => renderMemberNameItem(name)).join('')}</ul>`
    }

    return '<p class="entity-detail-empty">No members recorded.</p>'
}

function renderMemberItem(member, household) {
    const role = getMemberRole(member, household)
    const relationship = normalizeDisplayValue(member.relationshipToHouseholdHead)
    const metaParts = []

    if (relationship && role !== 'Head') metaParts.push(relationship)

    const age = getAgeFromBirthDate(member.birthDate)
    const sexLabel = getSexLabel(member.sex)
    if (sexLabel && sexLabel !== 'Unknown') metaParts.push(sexLabel)
    if (age !== null) metaParts.push(`${age} yrs old`)

    const roleBadge = role === 'Head'
        ? '<span class="household-member-role-badge">Head</span>'
        : ''

    const meta = metaParts.length
        ? `<div class="entity-detail-member-meta">${escapeHtml(metaParts.join(' · '))}</div>`
        : ''

    return `
        <li class="entity-detail-member-item">
            <div class="entity-detail-member-main">
                <strong>${escapeHtml(getResidentFullName(member))}</strong>
                ${roleBadge}
            </div>
            ${meta}
        </li>
    `
}

function renderMemberNameItem(name) {
    return `
        <li class="entity-detail-member-item">
            <div class="entity-detail-member-main">
                <strong>${escapeHtml(name)}</strong>
            </div>
        </li>
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
    const className = options.fullWidth ? 'entity-detail-field--full' : ''

    return `
        <div class="${className}">
            <dt>${escapeHtml(label)}</dt>
            <dd>${renderFieldValue(value)}</dd>
        </div>
    `
}

function renderFieldValue(value) {
    const normalized = normalizeDisplayValue(value)
    if (!normalized) return '<span class="entity-detail-empty">Not recorded</span>'

    return escapeHtml(normalized)
}

function renderMetadataFooter(household) {
    const householdId = household?.id
    if (!householdId) return ''

    const fullId = String(householdId)

    return `
        <footer class="entity-detail-metadata">
            <span class="entity-detail-metadata-label">Record ID</span>
            <div class="entity-detail-metadata-actions">
                <code class="entity-detail-metadata-id" title="${escapeHtml(fullId)}">${escapeHtml(truncateId(fullId))}</code>
                <button class="entity-detail-copy-btn" type="button" data-copy-household-id>Copy ID</button>
            </div>
        </footer>
    `
}

function getMemberRole(member, household) {
    if (member.householdRole === 'Head') return 'Head'

    const memberName = getResidentFullName(member)
    const headName = normalizeDisplayValue(household.head)
    if (headName && memberName === headName) return 'Head'

    return member.householdRole || 'Member'
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

function truncateId(value) {
    const id = String(value)
    if (id.length <= 20) return id

    return `${id.slice(0, 12)}…${id.slice(-4)}`
}

function normalizeDisplayValue(value) {
    const normalized = String(value ?? '').trim()
    if (!normalized || ['none', 'not recorded', 'not specified', 'not available'].includes(normalized.toLowerCase())) {
        return ''
    }

    return normalized
}
