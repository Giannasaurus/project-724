import { getData, postData, readResidentsExcel } from '../../core/api.js'
import { applyPermissionState } from '../../core/permissions.js'
import { sanitizeResidentPayload } from '../../shared/residentUtils.js'
import { saveResidentExtra, toResidentApiPayload } from './residentBackendAdapter.js'

const HEADER_ALIASES = {
    firstName: ['first name', 'firstname', 'given name'],
    middleName: ['middle name', 'middlename', 'middle initial', 'mi'],
    lastName: ['last name', 'lastname', 'surname', 'family name'],
    suffix: ['suffix', 'extension'],
    fullName: ['full name', 'name', 'resident name'],
    birthDate: ['birthdate', 'birth date', 'date of birth', 'dob'],
    placeOfBirth: ['place of birth', 'birth place', 'birthplace'],
    sex: ['sex', 'gender'],
    sector: ['sector', 'pwd/senior', 'pwd senior', 'classification'],
    civilStatus: ['civil status', 'civilstatus', 'marital status'],
    civilStatusOther: ['civil status other', 'other civil status', 'others civil status'],
    citizenship: ['citizenship', 'nationality'],
    religion: ['religion'],
    address: ['address', 'full address', 'residence', 'residential address'],
    houseNumberStreet: ['house number/street', 'house number street', 'house no street', 'street', 'house number'],
    purokZone: ['purok/zone', 'purok zone', 'zone', 'purok'],
    barangay: ['barangay', 'brgy'],
    municipalityCity: ['municipality/city', 'municipality city', 'city', 'municipality'],
    province: ['province'],
    contact: ['contact', 'contact number', 'phone', 'phone number', 'mobile', 'mobile number'],
    email: ['email', 'email address'],
    householdRole: ['household role', 'role in household', 'head/member', 'head or member'],
    householdHeadName: ['household head', 'head of household', 'household head name'],
    relationshipToHouseholdHead: ['relationship to household head', 'relationship', 'relation to household head'],
    householdMembers: ['household members', 'members of household'],
    occupation: ['occupation'],
    employerSchool: ['employer/school', 'employer school', 'employer', 'school'],
    highestEducationalAttainment: ['highest educational attainment', 'educational attainment', 'education'],
    remarks: ['remarks', 'remark'],
    proofType: ['proof type', 'verification proof type'],
    proofId: ['proof id', 'proof number', 'reference number', 'verification id', 'pwd id', 'senior id', 'supporting id'],
    verificationStatus: ['verification status', 'status'],
    verifiedBy: ['verified by', 'verifier'],
    verifiedAt: ['verified date', 'verified at', 'verification date']
}

const SEX_VALUES = {
    male: 0,
    m: 0,
    female: 1,
    f: 1
}

const SECTOR_VALUES = {
    general: 0,
    no: 0,
    none: 0,
    pwd: 1,
    senior: 2,
    'senior citizen': 2
}

const CIVIL_STATUS_VALUES = {
    single: 0,
    married: 1,
    widowed: 2,
    divorced: 3,
    annulled: 4,
    anulled: 4,
    separated: 5,
    'legally separated': 5,
    legallyseparated: 5,
    other: 6,
    others: 6
}

export function bindResidentImportControls(options = {}) {
    const importBtn = document.getElementById('importResidentsBtn')
    const statusEl = document.getElementById('residentImportStatus')
    if (!importBtn) return
    if (!applyPermissionState(importBtn, 'importResidents', { title: 'Admin permission required to import spreadsheet data.' })) return

    importBtn.addEventListener('click', async () => {
        setImportState(importBtn, statusEl, true, 'Choose a spreadsheet file to import.')

        try {
            const fileResult = await readResidentsExcel()
            if (fileResult.canceled) {
                setImportState(importBtn, statusEl, false, '')
                return
            }

            if (!fileResult.success) {
                setImportState(importBtn, statusEl, false, 'Failed to read the selected file.')
                console.error(fileResult.message)
                return
            }

            const preview = await getImportPreview(fileResult.rows, fileResult.fileName)
            setImportState(importBtn, statusEl, false, '')
            const confirmed = await showImportPreview(preview)
            if (!confirmed) {
                setImportStatus('Import canceled. No resident records were saved.')
                return
            }

            setImportState(importBtn, statusEl, true, 'Importing validated resident rows.')
            const importResult = await importResidentRows(preview.validRows, options)
            importResult.skipped += preview.blankRows + preview.invalidRows.length
            importResult.duplicates += preview.duplicateRows.length
            const statusMessage = getImportStatusMessage(importResult, fileResult.fileName)
            await options.showResidentsView?.(1)
            setImportState(importBtn, statusEl, false, '')
            setImportStatus(statusMessage)
        }
        catch (error) {
            setImportState(importBtn, statusEl, false, 'Failed to import residents.')
            console.error(error)
        }
    })
}

async function getImportPreview(rows = [], fileName = '') {
    const knownResidentKeys = await getExistingResidentKeys()
    const preview = {
        fileName,
        totalRows: rows.length,
        blankRows: 0,
        validRows: [],
        duplicateRows: [],
        invalidRows: []
    }
    const previewResidentKeys = new Set()

    for (const [index, row] of rows.entries()) {
        const rowNumber = index + 2
        const resident = parseResidentRow(row)

        if (!hasRowContent(row)) {
            preview.blankRows += 1
            continue
        }

        const validationError = getResidentValidationError(resident)
        if (validationError) {
            preview.invalidRows.push({ rowNumber, resident, reason: validationError })
            continue
        }

        const residentKey = getResidentDuplicateKey(resident)
        if (knownResidentKeys.has(residentKey) || previewResidentKeys.has(residentKey)) {
            preview.duplicateRows.push({ rowNumber, resident, reason: 'duplicate resident' })
            continue
        }

        const warnings = getResidentImportWarnings(resident)
        previewResidentKeys.add(residentKey)
        preview.validRows.push({ rowNumber, resident, warnings })
    }

    return preview
}

async function importResidentRows(rows = [], options = {}) {
    const summary = {
        imported: 0,
        failed: 0,
        skipped: 0,
        duplicates: 0,
        errors: []
    }
    const knownResidentKeys = await getExistingResidentKeys()

    for (const row of rows) {
        const rowNumber = row.rowNumber
        const resident = row.resident

        const residentKey = getResidentDuplicateKey(resident)
        if (knownResidentKeys.has(residentKey)) {
            summary.duplicates += 1
            continue
        }

        const result = await postData('/residents', toResidentApiPayload(resident))
        if (result.success) {
            summary.imported += 1
            knownResidentKeys.add(residentKey)
            saveResidentExtra(result.data ?? resident, resident)
            options.addResidentHistoryLog?.(result.data ?? resident)
        }
        else if (result.status === 409) {
            summary.duplicates += 1
            knownResidentKeys.add(residentKey)
        }
        else {
            summary.failed += 1
            summary.errors.push(`Row ${rowNumber}: save failed`)
            console.error(result.message)
        }
    }

    if (summary.errors.length > 0) {
        console.warn('Resident import issues:', summary.errors)
    }

    return summary
}

function showImportPreview(preview) {
    const dialog = document.getElementById('residentImportPreviewDialog')
    if (!dialog) return Promise.resolve(preview.validRows.length > 0)

    renderImportPreview(preview)

    const closeBtn = document.getElementById('importPreviewCloseBtn')
    const cancelBtn = document.getElementById('importPreviewCancelBtn')
    const confirmBtn = document.getElementById('importPreviewConfirmBtn')

    return new Promise(resolve => {
        const finish = (confirmed) => {
            dialog.close()
            closeBtn?.removeEventListener('click', onCancel)
            cancelBtn?.removeEventListener('click', onCancel)
            confirmBtn?.removeEventListener('click', onConfirm)
            dialog.removeEventListener('cancel', onDialogCancel)
            resolve(confirmed)
        }
        const onCancel = () => finish(false)
        const onConfirm = () => finish(true)
        const onDialogCancel = (event) => {
            event.preventDefault()
            finish(false)
        }

        closeBtn?.addEventListener('click', onCancel)
        cancelBtn?.addEventListener('click', onCancel)
        confirmBtn?.addEventListener('click', onConfirm)
        dialog.addEventListener('cancel', onDialogCancel)
        if (confirmBtn) confirmBtn.disabled = preview.validRows.length === 0
        dialog.showModal()
    })
}

function renderImportPreview(preview) {
    const fileEl = document.getElementById('importPreviewFile')
    const statsEl = document.getElementById('importPreviewStats')
    const rowsEl = document.getElementById('importPreviewRows')
    const issuesEl = document.getElementById('importPreviewIssues')
    const warningCount = preview.validRows.filter(row => row.warnings.length > 0).length
    const skippedCount = preview.blankRows + preview.duplicateRows.length + preview.invalidRows.length

    if (fileEl) fileEl.textContent = preview.fileName ? `Source: ${preview.fileName}` : 'Source: selected spreadsheet'
    if (statsEl) {
        statsEl.innerHTML = ''
        statsEl.append(
            createImportStat('Total rows', preview.totalRows),
            createImportStat('Ready', preview.validRows.length),
            createImportStat('Pending verification', warningCount),
            createImportStat('Issues', preview.invalidRows.length),
            createImportStat('Duplicates', preview.duplicateRows.length),
            createImportStat('Skipped', skippedCount)
        )
    }
    if (rowsEl) rowsEl.innerHTML = getPreviewRowsHtml(preview.validRows)
    if (issuesEl) issuesEl.innerHTML = getPreviewIssuesHtml(preview)
}

function createImportStat(label, value) {
    const item = document.createElement('div')
    const count = document.createElement('strong')
    const caption = document.createElement('span')
    count.textContent = String(value)
    caption.textContent = label
    item.append(count, caption)
    return item
}

function getPreviewRowsHtml(rows) {
    if (rows.length === 0) return '<p class="import-preview-empty">No valid rows detected.</p>'

    const body = rows.slice(0, 8).map(({ rowNumber, resident, warnings }) => `
        <tr>
            <td>${rowNumber}</td>
            <td>${escapeHtml(getPreviewResidentName(resident))}</td>
            <td>${escapeHtml(resident.birthDate)}</td>
            <td>${escapeHtml(getPreviewVerificationLabel(resident, warnings))}</td>
            <td>${escapeHtml(resident.address)}</td>
        </tr>
    `).join('')
    const more = rows.length > 8 ? `<p class="import-preview-note">Showing 8 of ${rows.length} valid rows.</p>` : ''

    return `
        <table class="import-preview-table">
            <thead>
                <tr><th>Row</th><th>Resident</th><th>Birthdate</th><th>Verification</th><th>Address</th></tr>
            </thead>
            <tbody>${body}</tbody>
        </table>
        ${more}
    `
}

function getPreviewIssuesHtml(preview) {
    const warnings = preview.validRows
        .filter(row => row.warnings.length > 0)
        .map(row => ({ ...row, type: 'Pending verification', reason: row.warnings.join(' ') }))
    const issues = [
        ...warnings,
        ...preview.invalidRows.map(row => ({ ...row, type: 'Invalid' })),
        ...preview.duplicateRows.map(row => ({ ...row, type: 'Duplicate' }))
    ]

    if (issues.length === 0 && preview.blankRows === 0) {
        return '<p class="import-preview-empty">No issues found.</p>'
    }

    const issueItems = issues.slice(0, 10).map(issue => `
        <li>
            <strong>Row ${issue.rowNumber}: ${escapeHtml(issue.type)}</strong>
            <span>${escapeHtml(issue.reason)}</span>
            <small>${escapeHtml(getPreviewResidentName(issue.resident) || 'No resident name parsed')}</small>
        </li>
    `).join('')
    const blankItem = preview.blankRows > 0
        ? `<li><strong>Blank rows</strong><span>${preview.blankRows} blank row${preview.blankRows === 1 ? '' : 's'} skipped.</span></li>`
        : ''
    const more = issues.length > 10 ? `<p class="import-preview-note">Showing 10 of ${issues.length} rows needing attention.</p>` : ''

    return `<ul>${issueItems}${blankItem}</ul>${more}`
}

async function getExistingResidentKeys() {
    const result = await getData('/residents')
    if (!result.success || !Array.isArray(result.data)) return new Set()

    return new Set(result.data.map(getResidentDuplicateKey))
}

function getResidentDuplicateKey(resident) {
    const firstName = getResidentValue(resident, 'firstName')
    const middleName = getResidentValue(resident, 'middleName')
    const lastName = getResidentValue(resident, 'lastName')
    const suffix = getResidentValue(resident, 'suffix')
    const middleInitial = middleName ? `${middleName[0]}.` : ''

    return normalizeKey(`${lastName}, ${firstName} ${middleInitial} ${suffix}`)
}

function getResidentValue(resident, field) {
    const pascalField = `${field[0].toUpperCase()}${field.slice(1)}`
    return normalizeCell(resident?.[field] ?? resident?.[pascalField])
}

function parseResidentRow(row) {
    const normalizedRow = getNormalizedRow(row)
    const nameParts = parseFullName(normalizedRow.fullName)

    return sanitizeResidentPayload({
        firstName: normalizedRow.firstName || nameParts.firstName,
        middleName: normalizedRow.middleName || nameParts.middleName,
        lastName: normalizedRow.lastName || nameParts.lastName,
        suffix: normalizedRow.suffix || nameParts.suffix || '',
        birthDate: normalizeBirthdate(normalizedRow.birthDate),
        placeOfBirth: normalizedRow.placeOfBirth,
        sex: mapValue(normalizedRow.sex, SEX_VALUES),
        sector: mapValue(normalizedRow.sector, SECTOR_VALUES, 0),
        civilStatus: mapValue(normalizedRow.civilStatus, CIVIL_STATUS_VALUES),
        civilStatusOther: normalizedRow.civilStatusOther,
        citizenship: normalizedRow.citizenship || 'Filipino',
        religion: normalizedRow.religion,
        address: normalizedRow.address || formatResidentAddress(normalizedRow),
        houseNumberStreet: normalizedRow.houseNumberStreet,
        purokZone: normalizedRow.purokZone,
        barangay: normalizedRow.barangay,
        municipalityCity: normalizedRow.municipalityCity,
        province: normalizedRow.province,
        contact: normalizedRow.contact || '',
        email: normalizedRow.email || '',
        householdRole: normalizeHouseholdRole(normalizedRow.householdRole),
        householdHeadName: normalizedRow.householdHeadName || '',
        relationshipToHouseholdHead: normalizedRow.relationshipToHouseholdHead || '',
        householdMembers: normalizedRow.householdMembers || '',
        occupation: normalizedRow.occupation || '',
        employerSchool: normalizedRow.employerSchool || '',
        highestEducationalAttainment: normalizedRow.highestEducationalAttainment || '',
        remarks: normalizedRow.remarks || '',
        proofType: normalizedRow.proofType || '',
        proofId: normalizedRow.proofId || '',
        verificationStatus: normalizedRow.verificationStatus || 'Pending',
        verifiedBy: normalizedRow.verifiedBy || '',
        verifiedAt: normalizedRow.verifiedAt || ''
    })
}

function getNormalizedRow(row) {
    const normalizedEntries = Object.entries(row).map(([key, value]) => [
        normalizeKey(key),
        normalizeCell(value)
    ])

    return Object.fromEntries(
        Object.entries(HEADER_ALIASES).map(([field, aliases]) => [
            field,
            getAliasedValue(normalizedEntries, aliases)
        ])
    )
}

function getAliasedValue(entries, aliases) {
    const normalizedAliases = aliases.map(normalizeKey)
    const match = entries.find(([key]) => normalizedAliases.includes(key))
    return match?.[1] ?? ''
}

function parseFullName(value) {
    const name = normalizeCell(value)
    if (!name) return {}

    if (name.includes(',')) {
        const [lastName, rest = ''] = name.split(',')
        const restParts = rest.trim().split(/\s+/).filter(Boolean)
        return {
            lastName: lastName.trim(),
            firstName: restParts.shift() ?? '',
            suffix: getSuffix(restParts.at(-1)) ? restParts.pop() : '',
            middleName: restParts.join(' ')
        }
    }

    const parts = name.split(/\s+/).filter(Boolean)
    return {
        firstName: parts.shift() ?? '',
        suffix: getSuffix(parts.at(-1)) ? parts.pop() : '',
        lastName: parts.pop() ?? '',
        middleName: parts.join(' ')
    }
}

function normalizeBirthdate(value) {
    const text = normalizeCell(value)
    if (!text) return ''

    const directDate = new Date(text)
    if (!Number.isNaN(directDate.getTime())) return formatDate(directDate)

    const numericParts = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (numericParts) {
        const [, first, second, year] = numericParts
        const firstNumber = Number(first)
        const secondNumber = Number(second)
        const month = firstNumber > 12 ? secondNumber : firstNumber
        const day = firstNumber > 12 ? firstNumber : secondNumber
        const date = new Date(Number(year), month - 1, day)
        if (!Number.isNaN(date.getTime())) return formatDate(date)
    }

    return text
}

function formatDate(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function getResidentValidationError(resident) {
    if (!resident.firstName || !resident.lastName) return 'missing resident name'
    if (!resident.birthDate) return 'missing birthdate'
    if (!isValidBirthdate(resident.birthDate)) return 'invalid birthdate'
    if (resident.sex === undefined) return 'invalid sex'
    if (resident.sector === undefined) return 'invalid sector'
    if (resident.civilStatus === undefined) return 'invalid civil status'
    if (resident.civilStatus === 6 && !resident.civilStatusOther) return 'missing other civil status'
    if (!resident.address) return 'missing address'
    if (resident.sector > 0 && resident.proofType && !['PWD ID', 'Senior Citizen ID', 'Medical Certificate'].includes(resident.proofType)) {
        return 'invalid proof type'
    }
    if (resident.householdRole === 'Head' && !resident.householdMembers) return 'household heads require household members'
    if (resident.householdRole === 'Member' && !resident.householdHeadName) return 'household members require a household head'
    return ''
}

function getResidentImportWarnings(resident) {
    const warnings = []
    if (resident.sector > 0 && (!resident.proofType || !resident.proofId)) {
        resident.verificationStatus = 'Pending'
        warnings.push('PWD/Senior sector imported without proof ID; resident is marked pending verification.')
    }
    return warnings
}

function formatResidentAddress(row) {
    return [
        row.houseNumberStreet,
        row.purokZone,
        row.barangay,
        row.municipalityCity,
        row.province
    ].filter(Boolean).join(', ')
}

function isValidBirthdate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false

    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    )
}

function mapValue(value, map, fallback) {
    const key = normalizeKey(value)
    if (!key) return fallback
    return map[key] ?? fallback
}

function getSuffix(value = '') {
    return ['jr', 'sr', 'ii', 'iii', 'iv', 'v'].includes(normalizeKey(value))
}

function hasRowContent(row) {
    return Object.values(row).some(value => normalizeCell(value))
}

function normalizeCell(value) {
    return String(value ?? '').trim()
}

function normalizeKey(value) {
    return normalizeCell(value)
        .toLowerCase()
        .replace(/\./g, '')
        .replace(/\s+/g, ' ')
}

function normalizeHouseholdRole(value) {
    const role = normalizeKey(value)
    if (role === 'head' || role === 'household head') return 'Head'
    if (role === 'member' || role === 'household member') return 'Member'
    return ''
}

function getImportStatusMessage(result, fileName) {
    const source = fileName ? ` from ${fileName}` : ''
    const parts = [`Imported ${result.imported} resident${result.imported === 1 ? '' : 's'}${source}.`]

    if (result.failed > 0) parts.push(`${result.failed} failed.`)
    if (result.skipped > 0) parts.push(`${result.skipped} blank row${result.skipped === 1 ? '' : 's'} skipped.`)
    if (result.duplicates > 0) parts.push(`${result.duplicates} duplicate resident${result.duplicates === 1 ? '' : 's'} skipped.`)
    if (result.errors.length > 0) parts.push(result.errors.slice(0, 2).join(' '))

    return parts.join(' ')
}

function setImportState(button, statusEl, isImporting, message) {
    button.disabled = isImporting
    button.textContent = isImporting ? 'Importing...' : 'Import spreadsheet'
    if (statusEl) statusEl.textContent = message
}

function setImportStatus(message) {
    const statusEl = document.getElementById('residentImportStatus')
    if (statusEl) statusEl.textContent = message
}

function getPreviewResidentName(resident) {
    return [
        resident.lastName ? `${resident.lastName},` : '',
        resident.firstName,
        resident.middleName,
        resident.suffix
    ].filter(Boolean).join(' ')
}

function getPreviewVerificationLabel(resident, warnings = []) {
    if (warnings.length > 0) return 'Pending verification'
    if (resident.sector > 0) return resident.verificationStatus || 'Pending'
    return 'Not required'
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[char])
}
