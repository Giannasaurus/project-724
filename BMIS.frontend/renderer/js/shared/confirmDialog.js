let activeConfirmDialog = null

export function openConfirmDialog({
    title = 'Confirm action',
    heading = 'Are you sure?',
    message = '',
    secondaryMessage = 'Be advised.',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel'
} = {}) {
    if (activeConfirmDialog) {
        activeConfirmDialog.close()
        activeConfirmDialog.remove()
        activeConfirmDialog = null
    }

    const dialog = document.createElement('dialog')
    dialog.className = 'delete-confirm-dialog'
    dialog.innerHTML = `
        <div class="delete-dialog-header">
            <h3></h3>
            <button class="delete-dialog-x" type="button" aria-label="Cancel confirmation">&times;</button>
        </div>
        <div class="delete-dialog-body">
            <h2></h2>
            <div class="delete-dialog-copy">
                <p></p>
                <p></p>
            </div>
            <div class="delete-dialog-actions">
                <button class="delete-dialog-cancel" type="button"></button>
                <button class="delete-dialog-confirm" type="button"></button>
            </div>
        </div>
    `

    dialog.querySelector('.delete-dialog-header h3').textContent = title
    dialog.querySelector('.delete-dialog-body h2').textContent = heading
    const copyLines = dialog.querySelectorAll('.delete-dialog-copy p')
    copyLines[0].textContent = message
    copyLines[1].textContent = secondaryMessage
    dialog.querySelector('.delete-dialog-cancel').textContent = cancelLabel

    const confirmBtn = dialog.querySelector('.delete-dialog-confirm')
    confirmBtn.textContent = confirmLabel

    document.body.appendChild(dialog)
    activeConfirmDialog = dialog

    return new Promise((resolve) => {
        let didResolve = false

        function finish(value) {
            if (didResolve) return
            didResolve = true
            dialog.close()
            dialog.remove()
            activeConfirmDialog = null
            resolve(value)
        }

        dialog.querySelector('.delete-dialog-x').addEventListener('click', () => finish(false))
        dialog.querySelector('.delete-dialog-cancel').addEventListener('click', () => finish(false))
        confirmBtn.addEventListener('click', () => finish(true))

        dialog.addEventListener('click', (event) => {
            const rect = dialog.getBoundingClientRect()
            const clickedInDialog = (
                rect.top <= event.clientY &&
                event.clientY <= rect.top + rect.height &&
                rect.left <= event.clientX &&
                event.clientX <= rect.left + rect.width
            )

            if (!clickedInDialog) finish(false)
        })

        dialog.addEventListener('cancel', (event) => {
            event.preventDefault()
            finish(false)
        })

        dialog.showModal()
    })
}
