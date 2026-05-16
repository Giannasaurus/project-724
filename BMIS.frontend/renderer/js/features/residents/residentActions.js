import { openEditResidentPage } from './residentForm.js'
import { openDeleteDialog } from './residentDeleteDialog.js'

export function createResidentActions(resident, options, actionOptions = {}) {
    const actions = document.createElement('div')
    actions.className = 'entity-row-actions'
    const buttons = [
        createActionButton('Edit', 'entity-action-btn', () => openEditResidentPage(resident, options)),
        createActionButton('Document Request', 'entity-action-btn', () => options.onDocumentRequest?.(resident)),
        createActionButton('Delete', 'entity-action-btn entity-action-btn--danger', () => {
            openDeleteDialog(resident, {
                addDeletedHistoryLog: options.addDeletedHistoryLog,
                onDeleted: options.showResidentsView
            })
        })
    ]

    if (actionOptions.includeView !== false) {
        buttons.unshift(createActionButton('View', 'entity-action-btn', () => actionOptions.onView?.(resident)))
    }

    actions.append(...buttons)

    return actions
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
