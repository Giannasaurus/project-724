import { getData, postData, readResidentsExcel } from '../../core/api.js'
import { sanitizeResidentPayload } from '../../shared/residentUtils.js'

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

            const importResult = await importResidentRows(fileResult.rows, options)
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

async function importResidentRows(rows = [], options = {}) {
    const summary = {
        imported: 0,
        failed: 0,
        skipped: 0,
        duplicates: 0,
        errors: []
    }
    const knownResidentKeys = await getExistingResidentKeys()

    for (const [index, row] of rows.entries()) {
        const rowNumber = index + 2
        const resident = parseResidentRow(row)

        if (!hasRowContent(row)) {
            summary.skipped += 1
            continue
        }

        const validationError = getResidentValidationError(resident)
        if (validationError) {
            summary.failed += 1
            summary.errors.push(`Row ${rowNumber}: ${validationError}`)
            continue
        }

        const residentKey = getResidentDuplicateKey(resident)
        if (knownResidentKeys.has(residentKey)) {
            summary.duplicates += 1
            continue
        }

        const result = await postData('/residents', resident)
        if (result.success) {
            summary.imported += 1
            knownResidentKeys.add(residentKey)
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
    if (resident.sector > 0 && !resident.proofType) return 'PWD/Senior residents require a proof type'
    if (resident.sector > 0 && !resident.proofId) return 'PWD/Senior residents require a proof number'
    if (resident.sector > 0 && !['PWD ID', 'Senior Citizen ID', 'Medical Certificate'].includes(resident.proofType)) {
        return 'invalid proof type'
    }
    if (resident.householdRole === 'Head' && !resident.householdMembers) return 'household heads require household members'
    if (resident.householdRole === 'Member' && !resident.householdHeadName) return 'household members require a household head'
    return ''
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
