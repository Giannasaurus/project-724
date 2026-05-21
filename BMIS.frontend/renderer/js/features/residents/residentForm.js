import { postData, updateData } from '../../core/api.js'
import { getResidentId, sanitizeResidentPayload } from '../../shared/residentUtils.js'

const ADD_RESIDENT_FORM_VIEW = 'views/subviews/add-resident.html'
const EDIT_RESIDENT_FORM_VIEW = 'views/subviews/edit-resident.html'
const RESIDENT_FORM_ID = 'addResidentForm'
const MIN_BIRTH_YEAR = 1900
const SENIOR_AGE = 60
const SECTOR_GENERAL = 0
const SECTOR_PWD = 1
const SECTOR_SENIOR = 2

export async function openAddResidentForm(options = {}) {
    const { ilView = document.getElementById('iLView'), addResidentHistoryLog, showResidentsView } = options
    if (!ilView) return

    const addResidentForm = await renderResidentForm(ilView, ADD_RESIDENT_FORM_VIEW)
    if (!addResidentForm) return

    if (options.householdHead) fillHouseholdMemberDefaults(options.householdHead)
    attachEnterToSubmit(addResidentForm)
    attachSeniorSectorHandler(addResidentForm)
    attachHouseholdRoleHandler(addResidentForm)
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
            const payload = getResidentPayload(values)
            const result = await postData('/residents', payload)

            if (result.success) {
                addResidentHistoryLog?.(result.data)
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

function getResidentPayload(values) {
    return sanitizeResidentPayload({
        firstName: values.firstName,
        middleName: values.middleName,
        lastName: values.lastName,
        suffix: values.suffix,
        birthDate: `${values.year}-${values.month.padStart(2, '0')}-${values.day.padStart(2, '0')}`,
        placeOfBirth: values.placeOfBirth,
        sex: values.sex,
        sector: values.sector,
        civilStatus: values.civilStatus,
        civilStatusOther: values.civilStatusOther,
        citizenship: values.citizenship,
        religion: values.religion,
        address: values.address,
        houseNumberStreet: values.houseNumberStreet,
        purokZone: values.purokZone,
        barangay: values.barangay,
        municipalityCity: values.municipalityCity,
        province: values.province,
        contact: values.contact,
        email: values.email,
        householdRole: values.householdRole,
        householdHeadName: values.householdHeadName,
        relationshipToHouseholdHead: values.relationshipToHouseholdHead,
        householdMembers: values.householdMembers,
        occupation: values.occupation,
        employerSchool: values.employerSchool,
        highestEducationalAttainment: values.highestEducationalAttainment,
        remarks: values.remarks,
        proofId: values.proofId
    })
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

    setInputDisabled(householdHead, !isMember, { clear: true })
    setInputDisabled(relationship, !isMember, { clear: true })
    setInputRequired(householdHead, isMember)
    setInputRequired(relationship, isMember)
    document.querySelectorAll('.household-member-required').forEach((marker) => {
        marker.hidden = !isMember
    })
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
        proofId: document.getElementById('ar-proofId')?.value.trim() ?? '',
    }

    values.address = formatResidentAddress(values)
    return values
}

function getResidentFormValidationError(values) {
    if (!values.firstName || !values.middleName || !values.lastName) {
        return 'Please fill in all required fields.'
    }

    const birthdateError = getBirthdateValidationError(values)
    if (birthdateError) return birthdateError

    const addressError = getAddressValidationError(values)
    if (addressError) return addressError

    if (!values.householdRole) return 'Please select whether the resident is the household head or a member.'
    if (values.householdRole === 'Member' && !values.householdHeadName) {
        return 'Household members must identify the household head they are related to.'
    }
    if (values.householdRole === 'Member' && !values.relationshipToHouseholdHead) {
        return 'Household members must include their relationship to the household head.'
    }
    if (values.sector > 0 && !values.proofId) {
        return 'PWD and Senior residents require a proof ID before they can be added.'
    }
    if (values.civilStatus === 6 && !values.civilStatusOther) {
        return 'Please specify the civil status when Others is selected.'
    }

    return ''
}

function getAddressValidationError(values) {
    if (!values.houseNumberStreet || !values.barangay || !values.municipalityCity || !values.province) {
        return 'Please complete the required address fields.'
    }

    return ''
}

function formatResidentAddress(values) {
    return [
        values.houseNumberStreet,
        values.purokZone,
        values.barangay,
        values.municipalityCity,
        values.province
    ].filter(Boolean).join(', ')
}

function getBirthdateValidationError(values) {
    if (!values.day || !values.year) {
        return 'Please enter a complete birthdate.'
    }

    if (!isWholeNumber(values.day) || !isWholeNumber(values.year)) {
        return 'Birthdate must use whole numbers for day and year.'
    }

    const day = Number(values.day)
    const month = Number(values.month)
    const year = Number(values.year)
    const currentYear = new Date().getFullYear()

    if (year < MIN_BIRTH_YEAR || year > currentYear) {
        return `Birth year must be between ${MIN_BIRTH_YEAR} and ${currentYear}.`
    }

    if (day < 1 || day > 31) {
        return 'Birth day must be between 1 and 31.'
    }

    if (!isRealDate(year, month, day)) {
        return 'Please enter a valid birthdate.'
    }

    if (isFutureDate(year, month, day)) {
        return 'Birthdate cannot be in the future.'
    }

    return ''
}

function isWholeNumber(value) {
    return /^\d+$/.test(value)
}

function isRealDate(year, month, day) {
    const date = new Date(year, month - 1, day)

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    )
}

function isFutureDate(year, month, day) {
    const today = new Date()
    const birthdate = new Date(year, month - 1, day)

    today.setHours(0, 0, 0, 0)
    return birthdate > today
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

function isCompleteRealBirthdate(values) {
    if (!values.day || !values.month || !values.year) return false
    if (!isWholeNumber(values.day) || !isWholeNumber(values.year)) return false

    return isRealDate(Number(values.year), Number(values.month), Number(values.day))
}

function getAge(values) {
    const today = new Date()
    const birthdate = new Date(Number(values.year), Number(values.month) - 1, Number(values.day))
    let age = today.getFullYear() - birthdate.getFullYear()
    const birthdayHasPassed = (
        today.getMonth() > birthdate.getMonth() ||
        (today.getMonth() === birthdate.getMonth() && today.getDate() >= birthdate.getDate())
    )

    if (!birthdayHasPassed) age -= 1
    return age
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
    attachHouseholdRoleHandler(editResidentForm)
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
            const payload = getResidentPayload(values)
            const result = await updateData(`/residents/${residentId}`, payload)

            if (result.success) {
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
    setInputValue('ar-proofId', resident.proofId)
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

function setInputValue(id, value) {
    const input = document.getElementById(id)
    if (input) input.value = value ?? ''
}

function setInputDisabled(input, disabled, options = {}) {
    if (!input) return

    input.disabled = disabled
    input.setAttribute('aria-disabled', String(disabled))
    if (disabled && options.clear) input.value = ''
}

function setInputRequired(input, required) {
    if (!input) return

    input.required = required
    input.setAttribute('aria-required', String(required))
}

function getSelectedRadioNumber(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`)
    return parseInt(checked?.value ?? '0', 10)
}

function getSelectedRadioValue(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value ?? ''
}

function setRadioValue(name, value) {
    const input = document.querySelector(`input[name="${name}"][value="${value ?? 0}"]`)
    if (input) input.checked = true
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
