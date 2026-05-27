import { postData, updateData } from '../../core/api.js'
import { getResidentFullName, getResidentId } from '../../shared/residentUtils.js'
import {
    ADD_RESIDENT_FORM_VIEW,
    AUTH_SESSION_KEY,
    EDIT_RESIDENT_FORM_VIEW,
    RESIDENT_FORM_ID,
    SECTOR_GENERAL,
    SECTOR_PWD,
    SECTOR_SENIOR,
    SENIOR_AGE
} from './residentFormConstants.js'
import { getAge, isCompleteRealBirthdate } from './residentFormDate.js'
import {
    escapeHtml,
    getSelectedRadioNumber,
    getSelectedRadioValue,
    setInputDisabled,
    setInputPlaceholder,
    setInputRequired,
    setInputValue,
    setRadioValue
} from './residentFormDom.js'
import { formatResidentAddress, getResidentPayload } from './residentFormPayload.js'
import { getResidentFormValidationError } from './residentFormValidation.js'
import { getResidentIntegrityError } from './residentIntegrity.js'
import { searchResidentsByName } from './residentSearch.js'
import { saveResidentExtra, toResidentApiPayload } from './residentBackendAdapter.js'

export async function openAddResidentForm(options = {}) {
    const { ilView = document.getElementById('iLView'), addResidentHistoryLog, showResidentsView } = options
    if (!ilView) return

    const addResidentForm = await renderResidentForm(ilView, ADD_RESIDENT_FORM_VIEW)
    if (!addResidentForm) return

    if (options.householdHead) fillHouseholdMemberDefaults(options.householdHead)
    attachEnterToSubmit(addResidentForm)
    attachSeniorSectorHandler(addResidentForm)
    attachSectorVerificationHandler(addResidentForm)
    attachHouseholdRoleHandler(addResidentForm)
    attachHouseholdHeadSearchHandler()
    attachSubmitHandler(addResidentForm, { addResidentHistoryLog, showResidentsView })
    attachNavigationHandlers(showResidentsView)
}

async function renderResidentForm(view, formViewPath) {
    view.innerHTML = ''

    try {
        const response = await fetch(formViewPath)
        if (!response.ok) throw new Error(response.status)

        view.innerHTML = await response.text()
    }
    catch (error) {
        console.error(`Cannot fetch ${formViewPath}`, error)
        view.innerHTML = `<p>Error loading resident form.</p>`
        return null
    }

    return document.getElementById(RESIDENT_FORM_ID)
}

function attachEnterToSubmit(form) {
    form.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.matches('input')) {
            e.preventDefault()
            form.requestSubmit()
        }
    })
}

function attachSubmitHandler(form, options) {
    const { addResidentHistoryLog, showResidentsView } = options

    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const errorEl = document.getElementById('ar-error')
        errorEl.textContent = ''

        const values = getResidentFormValues()
        const validationError = getResidentFormValidationError(values)

        if (validationError) {
            errorEl.textContent = validationError
            return
        }

        const saveBtn = getSubmitButton(e)
        setSubmitState(saveBtn, true)

        try {
            const integrityError = await getResidentIntegrityError(values)
            if (integrityError) {
                errorEl.textContent = integrityError
                return
            }

            const payload = getResidentPayload(values)
            const result = await postData('/residents', toResidentApiPayload(payload))

            if (result.success) {
                saveResidentExtra(result.data ?? payload, payload)
                addResidentHistoryLog?.(result.data ?? payload)
                if (saveBtn?.id === 'ar-saveAddMemberBtn') {
                    await openAddResidentForm({
                        ...options,
                        householdHead: getHouseholdHeadForNextMember(result.data ?? payload, payload)
                    })
                    return
                }
                await showResidentsView?.(1)
            } else {
                errorEl.textContent = 'Failed to save resident. Please try again.'
                console.error(result.message)
            }
        } catch (err) {
            errorEl.textContent = 'Failed to save resident. Please try again.'
            console.error(err)
        } finally {
            setSubmitState(saveBtn, false)
        }
    })
}

function attachNavigationHandlers(view) {
    const arCancelBtn = document.querySelector('.ar-cancel-btn')
    if (arCancelBtn) {
        arCancelBtn.addEventListener('click', async () => {
            await view?.(1)
        })
    }

    const backBtn = document.querySelector('.back-btn')
    if (backBtn) {
        backBtn.addEventListener('click', async () => {
            await view?.(1)
        })
    }
}

function attachSeniorSectorHandler(form) {
    const sector = document.getElementById('ar-sector')
    if (!sector) return

    getBirthdateInputs().forEach((input) => {
        input.addEventListener('input', updateSeniorSectorFromBirthdate)
        input.addEventListener('change', updateSeniorSectorFromBirthdate)
    })

    form.addEventListener('change', (event) => {
        if (event.target !== sector) return

        sector.dataset.userSelectedSector = Number(sector.value) === SECTOR_SENIOR ? '' : 'true'
    })

    updateSeniorSectorFromBirthdate()
}

function updateSeniorSectorFromBirthdate() {
    const sector = document.getElementById('ar-sector')
    if (!sector) return

    const values = getBirthdateInputValues()
    if (!isCompleteRealBirthdate(values)) return

    const age = getAge(values)
    if (age >= SENIOR_AGE && Number(sector.value) !== SECTOR_PWD) {
        sector.value = String(SECTOR_SENIOR)
        sector.dataset.userSelectedSector = ''
        return
    }

    if (age < SENIOR_AGE && Number(sector.value) === SECTOR_SENIOR && !sector.dataset.userSelectedSector) {
        sector.value = String(SECTOR_GENERAL)
    }
}

function attachSectorVerificationHandler(form) {
    const sector = document.getElementById('ar-sector')
    const status = document.getElementById('ar-verificationStatus')

    sector?.addEventListener('change', updateSectorVerificationControls)
    status?.addEventListener('change', syncVerificationMetadata)
    updateSectorVerificationControls()
}

function updateSectorVerificationControls() {
    const requiresVerification = getSelectedSector() > SECTOR_GENERAL
    const proofType = document.getElementById('ar-proofType')
    const proofId = document.getElementById('ar-proofId')
    const status = document.getElementById('ar-verificationStatus')
    const verifiedBy = document.getElementById('ar-verifiedBy')
    const verifiedAt = document.getElementById('ar-verifiedAt')

    setInputDisabled(proofType, !requiresVerification, { clear: true })
    setInputDisabled(proofId, !requiresVerification, { clear: true })
    setInputDisabled(status, !requiresVerification, { clear: true })
    setInputRequired(proofType, requiresVerification)
    setInputRequired(proofId, requiresVerification)
    setInputRequired(status, requiresVerification)

    if (!requiresVerification) {
        if (!status.value) setInputValue('ar-verificationStatus', 'Pending')
        setInputValue('ar-verifiedBy', '')
        setInputValue('ar-verifiedAt', '')
    }
    else {
        if (!status.value) status.value = 'Pending'
        syncVerificationMetadata()
    }

    setInputDisabled(verifiedBy, true)
    setInputDisabled(verifiedAt, true)
    document.querySelectorAll('.sector-verification-required').forEach((marker) => {
        marker.hidden = !requiresVerification
    })
}

function syncVerificationMetadata() {
    const requiresVerification = getSelectedSector() > SECTOR_GENERAL
    const status = document.getElementById('ar-verificationStatus')?.value
    if (!requiresVerification || status !== 'Verified') return

    if (!document.getElementById('ar-verifiedBy')?.value) {
        setInputValue('ar-verifiedBy', getCurrentVerifierName())
    }
    if (!document.getElementById('ar-verifiedAt')?.value) {
        setInputValue('ar-verifiedAt', new Date().toISOString().slice(0, 10))
    }
}

function attachHouseholdRoleHandler(form) {
    form.querySelectorAll('input[name="ar-householdRole"]').forEach((input) => {
        input.addEventListener('change', updateHouseholdRoleControls)
    })

    updateHouseholdRoleControls()
}

function updateHouseholdRoleControls() {
    const isMember = getSelectedRadioValue('ar-householdRole') === 'Member'
    const householdHead = document.getElementById('ar-householdHeadName')
    const relationship = document.getElementById('ar-relationshipToHouseholdHead')
    const searchBtn = document.getElementById('ar-householdHeadSearchBtn')
    const results = document.getElementById('ar-householdHeadResults')

    setInputDisabled(householdHead, !isMember, { clear: true })
    setInputDisabled(relationship, !isMember, { clear: true })
    setInputDisabled(searchBtn, !isMember)
    setInputPlaceholder(householdHead, isMember
        ? 'Search existing resident head'
        : 'Disabled because this resident is the household head')
    setInputPlaceholder(relationship, isMember
        ? 'Self, spouse, child, sibling'
        : 'Disabled because this resident is the household head')
    setInputRequired(householdHead, isMember)
    setInputRequired(relationship, isMember)
    document.querySelectorAll('.household-member-required').forEach((marker) => {
        marker.hidden = !isMember
    })
    if (!isMember && results) results.innerHTML = '<p>Household heads cannot assign another household head.</p>'
    if (isMember && results) results.innerHTML = ''
}

function attachHouseholdHeadSearchHandler() {
    const input = document.getElementById('ar-householdHeadName')
    const searchBtn = document.getElementById('ar-householdHeadSearchBtn')
    if (!input || !searchBtn) return

    searchBtn.addEventListener('click', searchHouseholdHeads)
    input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' || input.disabled) return

        event.preventDefault()
        searchHouseholdHeads()
    })
}

async function searchHouseholdHeads() {
    const input = document.getElementById('ar-householdHeadName')
    const results = document.getElementById('ar-householdHeadResults')
    const query = input?.value.trim() ?? ''
    if (!results) return

    if (!query) {
        results.innerHTML = '<p>Enter a resident name to search.</p>'
        return
    }

    results.innerHTML = '<p>Searching...</p>'
    const result = await searchResidentsByName(query, { from: 0, limit: 8 })
    const residents = result?.success && Array.isArray(result.data)
        ? result.data.filter(resident => resident.householdRole !== 'Member')
        : []

    renderHouseholdHeadResults(residents)
}

function renderHouseholdHeadResults(residents) {
    const results = document.getElementById('ar-householdHeadResults')
    if (!results) return

    results.innerHTML = ''
    if (residents.length === 0) {
        results.innerHTML = '<p>No household heads found.</p>'
        return
    }

    residents.forEach((resident) => {
        const button = document.createElement('button')
        button.className = 'household-head-result'
        button.type = 'button'
        button.innerHTML = `<span>${escapeHtml(getResidentFullName(resident))}</span><small>${escapeHtml(resident.address ?? '')}</small>`
        button.addEventListener('click', () => selectHouseholdHead(resident))
        results.appendChild(button)
    })
}

function selectHouseholdHead(resident) {
    setInputValue('ar-householdHeadName', getResidentFullName(resident))
    fillAddressFields(resident)
    const results = document.getElementById('ar-householdHeadResults')
    if (results) results.innerHTML = '<p>Household head selected.</p>'
}

function getResidentFormValues() {
    const values = {
        firstName: document.getElementById('ar-firstName').value.trim(),
        middleName: document.getElementById('ar-middleName').value.trim(),
        lastName: document.getElementById('ar-lastName').value.trim(),
        suffix: document.getElementById('ar-suffix').value.trim(),
        placeOfBirth: document.getElementById('ar-placeOfBirth')?.value.trim() ?? '',
        contact: document.getElementById('ar-contact')?.value.trim() ?? '',
        email: document.getElementById('ar-email')?.value.trim() ?? '',
        day: document.getElementById('ar-bday').value.trim(),
        month: document.getElementById('ar-bmonth').value,
        year: document.getElementById('ar-byear').value.trim(),
        sex: getSelectedRadioNumber('ar-sex'),
        sector: parseInt(document.getElementById('ar-sector').value, 10),
        civilStatus: parseInt(document.getElementById('ar-civilStatus').value, 10),
        civilStatusOther: document.getElementById('ar-civilStatusOther')?.value.trim() ?? '',
        citizenship: document.getElementById('ar-citizenship')?.value.trim() ?? '',
        religion: document.getElementById('ar-religion')?.value.trim() ?? '',
        houseNumberStreet: document.getElementById('ar-houseNumberStreet')?.value.trim() ?? '',
        purokZone: document.getElementById('ar-purokZone')?.value.trim() ?? '',
        barangay: document.getElementById('ar-barangay')?.value.trim() ?? '',
        municipalityCity: document.getElementById('ar-municipalityCity')?.value.trim() ?? '',
        province: document.getElementById('ar-province')?.value.trim() ?? '',
        householdRole: getSelectedRadioValue('ar-householdRole'),
        householdHeadName: document.getElementById('ar-householdHeadName')?.value.trim() ?? '',
        relationshipToHouseholdHead: document.getElementById('ar-relationshipToHouseholdHead')?.value.trim() ?? '',
        householdMembers: document.getElementById('ar-householdMembers')?.value.trim() ?? '',
        occupation: document.getElementById('ar-occupation')?.value.trim() ?? '',
        employerSchool: document.getElementById('ar-employerSchool')?.value.trim() ?? '',
        highestEducationalAttainment: document.getElementById('ar-highestEducationalAttainment')?.value.trim() ?? '',
        remarks: document.getElementById('ar-remarks')?.value.trim() ?? '',
        proofType: document.getElementById('ar-proofType')?.value ?? '',
        proofId: document.getElementById('ar-proofId')?.value.trim() ?? '',
        verificationStatus: document.getElementById('ar-verificationStatus')?.value ?? '',
        verifiedBy: document.getElementById('ar-verifiedBy')?.value.trim() ?? '',
        verifiedAt: document.getElementById('ar-verifiedAt')?.value.trim() ?? '',
    }

    values.address = formatResidentAddress(values)
    return values
}

function getBirthdateInputs() {
    return ['ar-bday', 'ar-bmonth', 'ar-byear']
        .map(id => document.getElementById(id))
        .filter(Boolean)
}

function getBirthdateInputValues() {
    return {
        day: document.getElementById('ar-bday')?.value.trim() ?? '',
        month: document.getElementById('ar-bmonth')?.value ?? '',
        year: document.getElementById('ar-byear')?.value.trim() ?? ''
    }
}

function getSelectedSector() {
    return Number(document.getElementById('ar-sector')?.value ?? SECTOR_GENERAL)
}

function setSubmitState(button, isSaving) {
    if (!button) return

    button.disabled = isSaving
    button.textContent = isSaving ? 'Saving...' : 'Save'
}

export async function openEditResidentPage(resident, options = {}) {
    if (!resident) return

    const { ilView = document.getElementById('iLView'), addUpdatedHistoryLog, showResidentsView } = options
    if (!ilView) return

    const editResidentForm = await renderResidentForm(ilView, EDIT_RESIDENT_FORM_VIEW)
    if (!editResidentForm) return

    fillResidentForm(resident)
    attachEnterToSubmit(editResidentForm)
    attachSeniorSectorHandler(editResidentForm)
    attachSectorVerificationHandler(editResidentForm)
    attachHouseholdRoleHandler(editResidentForm)
    attachHouseholdHeadSearchHandler()
    attachEditSubmitHandler(editResidentForm, resident, { addUpdatedHistoryLog, showResidentsView })
    attachNavigationHandlers(showResidentsView)
}

function getSubmitButton(event) {
    return event.submitter ?? document.getElementById('ar-saveBtn')
}

function getHouseholdHeadForNextMember(savedResident, payload) {
    if (payload.householdRole === 'Head') return { ...payload, ...savedResident }

    return {
        firstName: payload.householdHeadName,
        middleName: '',
        lastName: '',
        suffix: '',
        householdHeadName: payload.householdHeadName,
        address: payload.address,
        houseNumberStreet: payload.houseNumberStreet,
        purokZone: payload.purokZone,
        barangay: payload.barangay,
        municipalityCity: payload.municipalityCity,
        province: payload.province
    }
}

function attachEditSubmitHandler(form, resident, options) {
    const { addUpdatedHistoryLog, showResidentsView } = options

    form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const errorEl = document.getElementById('ar-error')
        errorEl.textContent = ''

        const residentId = getResidentId(resident)
        if (!residentId) {
            errorEl.textContent = 'Unable to update resident. Missing resident ID.'
            return
        }

        const values = getResidentFormValues()
        const validationError = getResidentFormValidationError(values)

        if (validationError) {
            errorEl.textContent = validationError
            return
        }

        const saveBtn = document.getElementById('ar-saveBtn')
        setSubmitState(saveBtn, true)

        try {
            const integrityError = await getResidentIntegrityError(values, { currentResident: resident })
            if (integrityError) {
                errorEl.textContent = integrityError
                return
            }

            const payload = getResidentPayload(values)
            const result = await updateData(`/residents/${residentId}`, toResidentApiPayload(payload))

            if (result.success) {
                saveResidentExtra(resident, payload)
                addUpdatedHistoryLog?.({ ...resident, ...payload })
                await showResidentsView?.(1)
            } else {
                errorEl.textContent = 'Failed to update resident. Please try again.'
                console.error(result.message)
            }
        } catch (err) {
            errorEl.textContent = 'Failed to update resident. Please try again.'
            console.error(err)
        } finally {
            setSubmitState(saveBtn, false)
        }
    })
}

function fillResidentForm(resident) {
    const birthdate = parseBirthdate(resident.birthDate)

    setInputValue('ar-firstName', resident.firstName)
    setInputValue('ar-middleName', resident.middleName)
    setInputValue('ar-lastName', resident.lastName)
    setInputValue('ar-suffix', resident.suffix)
    setInputValue('ar-placeOfBirth', resident.placeOfBirth)
    setInputValue('ar-contact', resident.contact)
    setInputValue('ar-email', resident.email)
    fillAddressFields(resident)
    setInputValue('ar-bday', birthdate.day)
    setInputValue('ar-bmonth', birthdate.month)
    setInputValue('ar-byear', birthdate.year)
    setRadioValue('ar-sex', resident.sex)
    setInputValue('ar-sector', resident.sector)
    setInputValue('ar-civilStatus', resident.civilStatus)
    setInputValue('ar-civilStatusOther', resident.civilStatusOther)
    setInputValue('ar-citizenship', resident.citizenship || 'Filipino')
    setInputValue('ar-religion', resident.religion)
    setRadioValue('ar-householdRole', resident.householdRole || 'Head')
    setInputValue('ar-householdHeadName', resident.householdHeadName)
    setInputValue('ar-relationshipToHouseholdHead', resident.relationshipToHouseholdHead)
    setInputValue('ar-householdMembers', resident.householdMembers)
    setInputValue('ar-occupation', resident.occupation)
    setInputValue('ar-employerSchool', resident.employerSchool)
    setInputValue('ar-highestEducationalAttainment', resident.highestEducationalAttainment)
    setInputValue('ar-remarks', resident.remarks)
    setInputValue('ar-proofType', resident.proofType)
    setInputValue('ar-proofId', resident.proofId)
    setInputValue('ar-verificationStatus', resident.verificationStatus || 'Pending')
    setInputValue('ar-verifiedBy', resident.verifiedBy)
    setInputValue('ar-verifiedAt', resident.verifiedAt)
}

function fillHouseholdMemberDefaults(householdHead) {
    setRadioValue('ar-householdRole', 'Member')
    updateHouseholdRoleControls()
    setInputValue('ar-householdHeadName', getResidentFormFullName(householdHead))
    setInputValue('ar-householdMembers', '')
    fillAddressFields(householdHead)

    const firstName = document.getElementById('ar-firstName')
    firstName?.focus()
}

function parseBirthdate(value) {
    const [year = '', month = '', day = ''] = String(value ?? '').split('-')

    return {
        day: String(Number(day) || ''),
        month: String(Number(month) || 1),
        year
    }
}

function fillAddressFields(resident) {
    setInputValue('ar-houseNumberStreet', resident.houseNumberStreet || resident.address)
    setInputValue('ar-purokZone', resident.purokZone)
    setInputValue('ar-barangay', resident.barangay || 'Barangay 724')
    setInputValue('ar-municipalityCity', resident.municipalityCity || 'Manila')
    setInputValue('ar-province', resident.province || 'Metro Manila')
}

function getResidentFormFullName(resident) {
    if (resident.householdHeadName && !resident.lastName) return resident.householdHeadName

    return [
        resident.firstName,
        resident.middleName,
        resident.lastName,
        resident.suffix
    ].filter(Boolean).join(' ')
}

function getCurrentVerifierName() {
    try {
        const session = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) ?? '{}')
        return [session.username, session.role].filter(Boolean).join(' / ')
    }
    catch {
        return ''
    }
}
