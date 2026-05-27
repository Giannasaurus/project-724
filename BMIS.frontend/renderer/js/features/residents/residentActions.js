import { applyPermissionState } from '../../core/permissions.js'
import { openAddResidentForm, openEditResidentPage } from './residentForm.js'

export function createResidentActions(resident, options, actionOptions = {}) {
    const actions = document.createElement('div')
    actions.className = 'entity-row-actions'
    const buttons = [
        createPermissionActionButton('Edit', 'entity-action-btn', 'editResidents', () => openEditResidentPage(resident, options)),
        createPermissionActionButton('Document Request', 'entity-action-btn', 'requestDocuments', () => options.onDocumentRequest?.(resident)),
        createDisabledActionButton('No deletion', 'entity-action-btn')
    ]

    if (actionOptions.includeView !== false) {
        buttons.unshift(createActionButton('View', 'entity-action-btn', () => actionOptions.onView?.(resident)))
    }

    if (resident.householdRole === 'Head') {
        buttons.splice(2, 0, createPermissionActionButton('Add Household Member', 'entity-action-btn', 'addResidents', () => {
            openAddResidentForm({
                ilView: document.getElementById('iLView'),
                addResidentHistoryLog: options.addResidentHistoryLog,
                showResidentsView: options.showResidentsView,
                householdHead: resident
            })
        }))
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

function createPermissionActionButton(label, className, permission, onClick) {
    const button = createActionButton(label, className, onClick)
    applyPermissionState(button, permission, { title: 'Admin permission required for this action.' })
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
        if (button.disabled) return
        onClick()
    })

    return button
}
