import { openConfirmDialog } from '../../shared/confirmDialog.js'
import { getResidentFullName } from '../../shared/residentUtils.js'
import { archiveResidentRecord, restoreResidentRecord } from './residentBackendAdapter.js'

export async function openArchiveResidentDialog(resident, options = {}) {
    const residentName = getResidentFullName(resident)
    const shouldArchive = await openConfirmDialog({
        title: 'Archive resident record?',
        heading: 'Retain, do not delete',
        message: `${residentName} will remain in the record system and be marked as archived on this device. This does not remove any backend data.`,
        confirmLabel: 'Archive record'
    })

    if (!shouldArchive) return

    const archivedResident = archiveResidentRecord(resident)
    if (!archivedResident) return

    options.addArchivedHistoryLog?.(archivedResident)
    await options.showResidentsView?.()
}

export async function openRestoreResidentDialog(resident, options = {}) {
    const residentName = getResidentFullName(resident)
    const shouldRestore = await openConfirmDialog({
        title: 'Restore resident record?',
        heading: 'Mark record active',
        message: `${residentName} will remain in the record system and be marked as active on this device.`,
        confirmLabel: 'Restore record'
    })

    if (!shouldRestore) return

    const restoredResident = restoreResidentRecord(resident)
    if (!restoredResident) return

    options.addRestoredHistoryLog?.(restoredResident)
    await options.showResidentsView?.()
}
