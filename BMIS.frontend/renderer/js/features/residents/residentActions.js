import { applyPermissionState } from '../../core/permissions.js'
import { openAddResidentForm, openEditResidentPage } from './residentForm.js'
import { openArchiveResidentDialog, openRestoreResidentDialog } from './residentArchiveDialog.js'
import { isResidentArchived } from './residentBackendAdapter.js'

export function createResidentActions(resident, options, actionOptions = {}) {
    const actions = document.createElement('div')
    actions.className = 'entity-row-actions'
    const isArchived = isResidentArchived(resident)
    const buttons = [
        createPermissionActionButton('Edit', 'entity-action-btn', 'editResidents', () => openEditResidentPage(resident, options)),
        createPermissionActionButton('Document Request', 'entity-action-btn', 'requestDocuments', () => options.onDocumentRequest?.(resident), {
            disabled: isArchived,
            title: 'Archived resident records are retained, but document requests should use active resident records.'
        }),
        isArchived
            ? createPermissionActionButton('Restore Record', 'entity-action-btn', 'editResidents', () => openRestoreResidentDialog(resident, options))
            : createPermissionActionButton('Archive Record', 'entity-action-btn', 'editResidents', () => openArchiveResidentDialog(resident, options))
    ]

    if (actionOptions.includeView !== false) {
        buttons.unshift(createActionButton('View', 'entity-action-btn', () => actionOptions.onView?.(resident)))
    }

    if (!isArchived && resident.householdRole === 'Head') {
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

function createPermissionActionButton(label, className, permission, onClick, options = {}) {
    const button = createActionButton(label, className, onClick)
    applyPermissionState(button, permission, { title: 'Admin permission required for this action.' })
    if (options.disabled) {
        button.disabled = true
        button.title = options.title ?? button.title
    }
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
