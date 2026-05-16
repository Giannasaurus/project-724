import { HOUSEHOLDS_STORAGE_KEY } from './householdConstants.js'

export function readManualHouseholds() {
    try {
        const rawHouseholds = localStorage.getItem(HOUSEHOLDS_STORAGE_KEY)
        return rawHouseholds ? JSON.parse(rawHouseholds) : []
    }
    catch (error) {
        console.error('Failed to read households.', error)
        return []
    }
}

export function writeManualHouseholds(householdsToSave) {
    localStorage.setItem(HOUSEHOLDS_STORAGE_KEY, JSON.stringify(householdsToSave))
}
