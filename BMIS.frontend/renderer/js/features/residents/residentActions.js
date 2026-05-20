import { openEditResidentPage } from './residentForm.js'

export function createResidentActions(resident, options, actionOptions = {}) {
    const actions = document.createElement('div')
    actions.className = 'entity-row-actions'
    const buttons = [
        createActionButton('Edit', 'entity-action-btn', () => openEditResidentPage(resident, options)),
        createActionButton('Document Request', 'entity-action-btn', () => options.onDocumentRequest?.(resident)),
        createDisabledActionButton('No deletion', 'entity-action-btn')
    ]

    if (actionOptions.includeView !== false) {
        buttons.unshift(createActionButton('View', 'entity-action-btn', () => actionOptions.onView?.(resident)))
    }

    actions.append(...buttons)

    return actions
}

function createDisabledActionButton(label, className) {
    const button = document.createElement('button')

    button.className = className
    button.type = 'button'
    button.textContent = label
    button.disabled = true
    button.title = 'Resident records are retained for transparency. Edit the record instead of deleting it.'

    return button
}

function createActionButton(label, className, onClick) {
    const button = document.createElement('button')

    button.className = className
    button.type = 'button'
    button.textContent = label
    button.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
    })

    return button
}
