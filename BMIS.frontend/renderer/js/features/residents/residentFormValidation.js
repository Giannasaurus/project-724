import { SECTOR_GENERAL, SECTOR_PROOF_TYPES } from './residentFormConstants.js'
import { getBirthdateValidationError } from './residentFormDate.js'

export function getResidentFormValidationError(values) {
    if (!values.firstName || !values.middleName || !values.lastName) {
        return 'Please fill in all required fields.'
    }

    const birthdateError = getBirthdateValidationError(values)
    if (birthdateError) return birthdateError

    const addressError = getAddressValidationError(values)
    if (addressError) return addressError

    if (!values.householdRole) return 'Please select whether the resident is the household head or a member.'
    if (values.householdRole === 'Member' && !values.householdHeadName) {
        return 'Household members must identify the household head they are related to.'
    }
    if (values.householdRole === 'Member' && !values.relationshipToHouseholdHead) {
        return 'Household members must include their relationship to the household head.'
    }

    const verificationError = getSectorVerificationError(values)
    if (verificationError) return verificationError

    if (values.proofType && !SECTOR_PROOF_TYPES.includes(values.proofType)) {
        return 'Proof type must be PWD ID, Senior Citizen ID, or Medical Certificate.'
    }
    if (values.civilStatus === 6 && !values.civilStatusOther) {
        return 'Please specify the civil status when Others is selected.'
    }

    return ''
}

function getSectorVerificationError(values) {
    if (values.sector <= SECTOR_GENERAL) return ''
    if (!values.proofType) return 'PWD and Senior residents require a proof type.'
    if (!values.proofId) return 'PWD and Senior residents require a proof or reference number.'
    if (!values.verificationStatus) return 'PWD and Senior residents require a verification status.'
    if (values.verificationStatus === 'Verified' && (!values.verifiedBy || !values.verifiedAt)) {
        return 'Verified PWD/Senior records require verifier and verification date.'
    }

    return ''
}

function getAddressValidationError(values) {
    if (!values.houseNumberStreet || !values.barangay || !values.municipalityCity || !values.province) {
        return 'Please complete the required address fields.'
    }

    return ''
}
