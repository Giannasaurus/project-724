import { deleteData } from '../../core/api.js'
import { getResidentFullName, getResidentId } from '../../shared/residentUtils.js'

export function openDeleteDialog(resident, options = {}) {
    const dialog = document.getElementById('deleteConfirmDialog')
    const closeBtn = document.getElementById('deleteDialogCloseBtn')
    const cancelBtn = document.getElementById('deleteDialogCancelBtn')
    const confirmBtn = document.getElementById('deleteDialogConfirmBtn')
    const errorEl = document.getElementById('deleteDialogError')
    const titleEl = dialog?.querySelector('.delete-dialog-header h3')
    const headingEl = dialog?.querySelector('.delete-dialog-body h2')
    const copyEl = dialog?.querySelector('.delete-dialog-copy p')
    const residentId = getResidentId(resident)

    if (!dialog || !closeBtn || !cancelBtn || !confirmBtn || !errorEl) return

    function closeDialog() {
        errorEl.textContent = ''
        confirmBtn.disabled = false
        confirmBtn.textContent = 'Delete'
        dialog.close()
    }

    closeBtn.onclick = closeDialog
    cancelBtn.onclick = closeDialog
    dialog.onclick = (e) => {
        const rect = dialog.getBoundingClientRect()
        const clickedInDialog = (
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width
        )

        if (!clickedInDialog) closeDialog()
    }

    confirmBtn.onclick = async () => {
        if (!residentId) {
            errorEl.textContent = 'Unable to delete this resident. Missing resident ID.'
            return
        }

        confirmBtn.disabled = true
        confirmBtn.textContent = 'Deleting...'
        errorEl.textContent = ''

        let result
        try {
            result = await deleteData('/residents', residentId)
        }
        catch (error) {
            result = { success: false, message: error.message }
        }

        if (result?.success) {
            options.addDeletedHistoryLog?.(resident)
            closeDialog()
            await options.onDeleted?.()
            return
        }

        confirmBtn.disabled = false
        confirmBtn.textContent = 'Delete'
        errorEl.textContent = 'Failed to delete resident. Please try again.'
        console.error(result?.message ?? 'Delete request failed.')
    }

    errorEl.textContent = ''
    if (titleEl) titleEl.textContent = 'Delete resident?'
    if (headingEl) headingEl.textContent = 'Are you sure?'
    if (copyEl) copyEl.textContent = `This will remove ${getResidentFullName(resident)} from the residents list.`
    confirmBtn.disabled = false
    confirmBtn.textContent = 'Delete'
    dialog.showModal()
}
