import { postData, updateData } from '../../core/api.js'
import { getResidentId } from '../../shared/residentUtils.js'

const ADD_RESIDENT_FORM_VIEW = 'views/subviews/add-resident.html'
const EDIT_RESIDENT_FORM_VIEW = 'views/subviews/edit-resident.html'
const RESIDENT_FORM_ID = 'addResidentForm'
const MIN_BIRTH_YEAR = 1900

export async function openAddResidentForm(options = {}) {
    const { ilView, addResidentHistoryLog, showResidentsView } = options
    if (!ilView) return

    const addResidentForm = await renderResidentForm(ilView, ADD_RESIDENT_FORM_VIEW)
    if (!addResidentForm) return

    attachEnterToSubmit(addResidentForm)
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

        const saveBtn = document.getElementById('ar-saveBtn')
        setSubmitState(saveBtn, true)

        try {
            const payload = getResidentPayload(values)
            const result = await postData('/residents', payload)

            if (result.success) {
                addResidentHistoryLog?.(result.data)
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
    return {
        firstName: values.firstName,
        middleName: values.middleName,
        lastName: values.lastName,
        suffix: values.suffix,
        birthDate: `${values.year}-${values.month.padStart(2, '0')}-${values.day.padStart(2, '0')}`,
        sex: values.sex,
        sector: values.sector,
        civilStatus: values.civilStatus,
        address: values.address,
        contact: values.contact,
        email: values.email,
        householdRole: values.householdRole,
        householdHeadName: values.householdHeadName,
        householdMembers: values.householdMembers,
        proofId: values.proofId
    }
}

function getResidentFormValues() {
    return {
        firstName: document.getElementById('ar-firstName').value.trim(),
        middleName: document.getElementById('ar-middleName').value.trim(),
        lastName: document.getElementById('ar-lastName').value.trim(),
        suffix: document.getElementById('ar-suffix').value.trim(),
        contact: document.getElementById('ar-contact')?.value.trim() ?? '',
        email: document.getElementById('ar-email')?.value.trim() ?? '',
        address: document.getElementById('ar-address').value.trim(),
        day: document.getElementById('ar-bday').value.trim(),
        month: document.getElementById('ar-bmonth').value,
        year: document.getElementById('ar-byear').value.trim(),
        sex: parseInt(document.getElementById('ar-sex').value, 10),
        sector: parseInt(document.getElementById('ar-sector').value, 10),
        civilStatus: parseInt(document.getElementById('ar-civilStatus').value, 10),
        householdRole: document.getElementById('ar-householdRole')?.value ?? '',
        householdHeadName: document.getElementById('ar-householdHeadName')?.value.trim() ?? '',
        householdMembers: document.getElementById('ar-householdMembers')?.value.trim() ?? '',
        proofId: document.getElementById('ar-proofId')?.value.trim() ?? '',
    }
}

function getResidentFormValidationError(values) {
    if (!values.firstName || !values.middleName || !values.lastName || !values.address) {
        return 'Please fill in all required fields.'
    }

    const birthdateError = getBirthdateValidationError(values)
    if (birthdateError) return birthdateError

    if (!values.householdRole) return 'Please select whether the resident is the household head or a member.'
    if (values.householdRole === 'Head' && !values.householdMembers) {
        return 'Household heads must include the residents that are part of the household.'
    }
    if (values.householdRole === 'Member' && !values.householdHeadName) {
        return 'Household members must identify the household head they are related to.'
    }
    if (values.sector > 0 && !values.proofId) {
        return 'PWD and Senior residents require a proof ID before they can be added.'
    }

    return ''
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
    attachEditSubmitHandler(editResidentForm, resident, { addUpdatedHistoryLog, showResidentsView })
    attachNavigationHandlers(showResidentsView)
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
    setInputValue('ar-contact', resident.contact)
    setInputValue('ar-email', resident.email)
    setInputValue('ar-address', resident.address)
    setInputValue('ar-bday', birthdate.day)
    setInputValue('ar-bmonth', birthdate.month)
    setInputValue('ar-byear', birthdate.year)
    setInputValue('ar-sex', resident.sex)
    setInputValue('ar-sector', resident.sector)
    setInputValue('ar-civilStatus', resident.civilStatus)
    setInputValue('ar-householdRole', resident.householdRole)
    setInputValue('ar-householdHeadName', resident.householdHeadName)
    setInputValue('ar-householdMembers', resident.householdMembers)
    setInputValue('ar-proofId', resident.proofId)
}

function setInputValue(id, value) {
    const input = document.getElementById(id)
    if (input) input.value = value ?? ''
}

function parseBirthdate(value) {
    const [year = '', month = '', day = ''] = String(value ?? '').split('-')

    return {
        day: String(Number(day) || ''),
        month: String(Number(month) || 1),
        year
    }
}
