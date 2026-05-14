import { getActivityLogSettings, resetActivityLogSettings, saveActivityLogSettings } from './activityLogSettings.js'
import { getDocumentDefaults, resetDocumentDefaults, saveDocumentDefaults } from './documentDefaults.js'
import { openConfirmDialog } from '../../shared/confirmDialog.js'

const RESIDENT_HISTORY_KEY = 'bmisResidentHistory'

export function initSettingsPage() {
    bindSettingsTabs()
    initDocumentDefaultsSettings()
    initActivityLogSettings()
}

function bindSettingsTabs() {
    const tabs = document.querySelectorAll('[data-settings-panel]')
    const panels = document.querySelectorAll('[data-settings-panel-id]')

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const panelId = tab.dataset.settingsPanel

            tabs.forEach(item => item.classList.toggle('active', item === tab))
            panels.forEach(panel => {
                panel.hidden = panel.dataset.settingsPanelId !== panelId
            })
        })
    })
}

function initDocumentDefaultsSettings() {
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

function initActivityLogSettings() {
    const form = document.getElementById('activityLogSettingsForm')
    const resetBtn = document.getElementById('activityLogSettingsResetBtn')
    const clearBtn = document.getElementById('activityLogClearBtn')
    const status = document.getElementById('activityLogSettingsStatus')
    if (!form) return

    fillForm(form, getActivityLogSettings())

    form.addEventListener('submit', (event) => {
        event.preventDefault()
        saveActivityLogSettings(getActivityLogFormValues(form))
        trimResidentHistoryToLimit()
        setStatus(status, 'Activity log settings saved.')
    })

    resetBtn?.addEventListener('click', () => {
        fillForm(form, resetActivityLogSettings())
        trimResidentHistoryToLimit()
        setStatus(status, 'Activity log settings reset.')
    })

    clearBtn?.addEventListener('click', async () => {
        const shouldClear = await openConfirmDialog({
            title: 'Clear activity log?',
            heading: 'Clear local activity?',
            message: 'This removes the Activity Log records saved on this device. This cannot be undone.',
            confirmLabel: 'Clear log'
        })
        if (!shouldClear) return

        localStorage.removeItem(RESIDENT_HISTORY_KEY)
        setStatus(status, 'Activity log cleared.')
    })
}

function fillForm(form, defaults) {
    Object.entries(defaults).forEach(([key, value]) => {
        const input = form.elements[key]
        if (!input) return

        if (input.type === 'checkbox') {
            input.checked = Boolean(value)
            return
        }

        input.value = value ?? ''
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

function getActivityLogFormValues(form) {
    return {
        enabled: form.elements.enabled.checked,
        maxEntries: form.elements.maxEntries.value
    }
}

function trimResidentHistoryToLimit() {
    const settings = getActivityLogSettings()

    try {
        const history = JSON.parse(localStorage.getItem(RESIDENT_HISTORY_KEY) ?? '[]')
        if (!Array.isArray(history)) return

        localStorage.setItem(RESIDENT_HISTORY_KEY, JSON.stringify(history.slice(0, settings.maxEntries)))
    }
    catch {
        localStorage.removeItem(RESIDENT_HISTORY_KEY)
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
