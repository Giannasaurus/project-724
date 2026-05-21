export function setInputValue(id, value) {
    const input = document.getElementById(id)
    if (input) input.value = value ?? ''
}

export function setInputDisabled(input, disabled, options = {}) {
    if (!input) return

    input.disabled = disabled
    input.setAttribute('aria-disabled', String(disabled))
    if (disabled && options.clear) input.value = ''
}

export function setInputPlaceholder(input, placeholder) {
    if (input) input.placeholder = placeholder
}

export function setInputRequired(input, required) {
    if (!input) return

    input.required = required
    input.setAttribute('aria-required', String(required))
}

export function getSelectedRadioNumber(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`)
    return parseInt(checked?.value ?? '0', 10)
}

export function getSelectedRadioValue(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value ?? ''
}

export function setRadioValue(name, value) {
    const input = document.querySelector(`input[name="${name}"][value="${value ?? 0}"]`)
    if (input) input.checked = true
}

export function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[char])
}
