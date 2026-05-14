import { getDocumentDefaults, resetDocumentDefaults, saveDocumentDefaults } from './documentDefaults.js'

export function initSettingsPage() {
    const form = document.getElementById('documentDefaultsForm')
    const resetBtn = document.getElementById('settingsResetBtn')
    const status = document.getElementById('settingsStatus')
    if (!form) return

    fillForm(form, getDocumentDefaults())

    form.addEventListener('submit', (event) => {
        event.preventDefault()
        saveDocumentDefaults(getFormValues(form))
        setStatus(status, 'Document defaults saved.')
    })

    resetBtn?.addEventListener('click', () => {
        fillForm(form, resetDocumentDefaults())
        setStatus(status, 'Document defaults reset.')
    })
}

function fillForm(form, defaults) {
    Object.entries(defaults).forEach(([key, value]) => {
        const input = form.elements[key]
        if (input) input.value = value ?? ''
    })
}

function getFormValues(form) {
    return {
        barangayName: form.elements.barangayName.value.trim(),
        barangayZone: form.elements.barangayZone.value.trim(),
        barangayAddress: form.elements.barangayAddress.value.trim(),
        chairName: form.elements.chairName.value.trim(),
        chairTitle: form.elements.chairTitle.value.trim(),
        email: form.elements.email.value.trim(),
        facebook: form.elements.facebook.value.trim()
    }
}

function setStatus(status, message) {
    if (!status) return

    status.textContent = message
    window.clearTimeout(setStatus.timer)
    setStatus.timer = window.setTimeout(() => {
        status.textContent = ''
    }, 3000)
}
