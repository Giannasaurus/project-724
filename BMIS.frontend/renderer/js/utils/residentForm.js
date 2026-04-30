import { postData } from './api.js'

export async function openAddResidentForm(options = {}) {
    const { ilView, addResidentHistoryLog } = options
    if (!ilView) return

    ilView.innerHTML = ''
    const response = await fetch('./views/subviews/addResident.html')

    try {
        if (!response.ok) throw new Error(response.status)
    }
    catch (err) {
        console.log(err)
        return
    }

    const html = await response.text()
    ilView.innerHTML = html

    const addResidentForm = document.getElementById('addResidentForm')
    if (!addResidentForm) return

    addResidentForm.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.matches('input')) {
            e.preventDefault()
            addResidentForm.requestSubmit()
        }
    })

    addResidentForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const errorEl = document.getElementById('ar-error')
        errorEl.textContent = ''

        const values = getAddResidentFormValues()

        if (!values.firstName || !values.middleName || !values.lastName || !values.address || !values.day || !values.year) {
            errorEl.textContent = 'Please fill in all required fields.'
            return
        }

        const payload = getAddResidentPayload(values)

        const saveBtn = document.getElementById('ar-saveBtn')
        saveBtn.disabled = true
        saveBtn.textContent = 'Saving...'

        const result = await postData('/residents', payload)

        saveBtn.disabled = false
        saveBtn.textContent = 'Save'

        if (result.success) {
            addResidentHistoryLog?.(result.data)
            await showResidentsView?.(1)
        } else {
            errorEl.textContent = 'Failed to save resident. Please try again.'
            console.error(result.message)
        }
    })

    const arCancelBtn = document.querySelector('.ar-cancel-btn')
    if (arCancelBtn) {
        arCancelBtn.addEventListener('click', async () => {
            await showResidentsView?.(1)
        })
    }

    const backBtn = document.querySelector('.back-btn')
    if (backBtn) {
        backBtn.addEventListener('click', async () => {
            await showResidentsView?.(1)
        })
    }
}

function getAddResidentFormValues() {
    return {
        firstName: document.getElementById('ar-firstName').value.trim(),
        middleName: document.getElementById('ar-middleName').value.trim(),
        lastName: document.getElementById('ar-lastName').value.trim(),
        suffix: document.getElementById('ar-suffix').value.trim(),
        address: document.getElementById('ar-address').value.trim(),
        day: document.getElementById('ar-bday').value.padStart(2, '0'),
        month: String(document.getElementById('ar-bmonth').value).padStart(2, '0'),
        year: document.getElementById('ar-byear').value,
        sex: parseInt(document.getElementById('ar-sex').value),
        sector: parseInt(document.getElementById('ar-sector').value),
        civilStatus: parseInt(document.getElementById('ar-civilStatus').value),
    }
}

function getAddResidentPayload(values) {
    return {
        firstName: values.firstName,
        middleName: values.middleName,
        lastName: values.lastName,
        suffix: values.suffix,
        birthDate: `${values.year}-${values.month}-${values.day}`,
        sex: values.sex,
        sector: values.sector,
        civilStatus: values.civilStatus,
        address: values.address
    }
}

export function openEditResidentPage(viewToReplace) {
    // render Edit Resident subview
    // pre-fill input fields with the target resident

}
