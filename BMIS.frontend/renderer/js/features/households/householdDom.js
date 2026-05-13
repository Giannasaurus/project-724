export function getHouseholdElements() {
    return {
        actionBar: document.getElementById('householdActionBar'),
        addBtn: document.getElementById('addHouseholdBtn'),
        addView: document.getElementById('addHouseholdView'),
        backBtn: document.getElementById('householdBackBtn'),
        cancelBtn: document.getElementById('householdCancelBtn'),
        deleteCancelBtn: document.getElementById('householdDeleteCancelBtn'),
        deleteCloseBtn: document.getElementById('householdDeleteCloseBtn'),
        deleteConfirmBtn: document.getElementById('householdDeleteConfirmBtn'),
        deleteCopy: document.getElementById('householdDeleteCopy'),
        deleteDialog: document.getElementById('householdDeleteDialog'),
        deleteError: document.getElementById('householdDeleteError'),
        detailsBackBtn: document.getElementById('householdDetailsBackBtn'),
        detailsContent: document.getElementById('householdDetailsContent'),
        detailsView: document.getElementById('householdDetailsView'),
        form: document.getElementById('householdForm'),
        formError: document.getElementById('householdFormError'),
        formTitle: document.getElementById('householdFormTitle'),
        headSelect: document.getElementById('householdHeadSelect'),
        list: document.getElementById('householdsList'),
        listView: document.getElementById('householdsListView'),
        memberSearch: document.getElementById('householdMemberSearch'),
        membersBody: document.getElementById('householdMembersBody'),
        nameInput: document.getElementById('householdNameInput'),
        searchInput: document.getElementById('householdSearch')
    }
}

export function createActionButton(label, className, onClick, options = {}) {
    const button = document.createElement('button')

    button.className = className
    button.type = 'button'
    button.textContent = label
    button.disabled = Boolean(options.disabled)
    if (options.title) button.title = options.title
    button.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        if (!button.disabled) onClick()
    })

    return button
}

export function createEmptyMessage(message, className) {
    const element = document.createElement('p')
    element.className = className
    element.textContent = message
    return element
}

export function createTableCell(content) {
    const cell = document.createElement('td')

    if (content instanceof Node) {
        cell.appendChild(content)
    }
    else {
        cell.textContent = content
    }

    return cell
}

export function clearElement(element) {
    if (element) element.innerHTML = ''
}

export function setText(element, value) {
    if (element) element.textContent = value
}

export function setInputValue(input, value) {
    if (input) input.value = value ?? ''
}
