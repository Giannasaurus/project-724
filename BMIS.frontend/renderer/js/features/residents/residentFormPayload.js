import { sanitizeResidentPayload } from '../../shared/residentUtils.js'

export function getResidentPayload(values) {
    return sanitizeResidentPayload({
        firstName: values.firstName,
        middleName: values.middleName,
        lastName: values.lastName,
        suffix: values.suffix,
        birthDate: `${values.year}-${values.month.padStart(2, '0')}-${values.day.padStart(2, '0')}`,
        placeOfBirth: values.placeOfBirth,
        sex: values.sex,
        sector: values.sector,
        civilStatus: values.civilStatus,
        civilStatusOther: values.civilStatusOther,
        citizenship: values.citizenship,
        religion: values.religion,
        address: values.address,
        houseNumberStreet: values.houseNumberStreet,
        purokZone: values.purokZone,
        barangay: values.barangay,
        municipalityCity: values.municipalityCity,
        province: values.province,
        contact: values.contact,
        email: values.email,
        householdRole: values.householdRole,
        householdHeadName: values.householdHeadName,
        relationshipToHouseholdHead: values.relationshipToHouseholdHead,
        householdMembers: values.householdMembers,
        occupation: values.occupation,
        employerSchool: values.employerSchool,
        highestEducationalAttainment: values.highestEducationalAttainment,
        remarks: values.remarks,
        proofType: values.proofType,
        proofId: values.proofId,
        verificationStatus: values.verificationStatus,
        verifiedBy: values.verifiedBy,
        verifiedAt: values.verifiedAt
    })
}

export function formatResidentAddress(values) {
    return [
        values.houseNumberStreet,
        values.purokZone,
        values.barangay,
        values.municipalityCity,
        values.province
    ].filter(Boolean).join(', ')
}
