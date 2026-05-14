export const DOCUMENT_TYPES = {
    0: 'Barangay Clearance',
    1: 'Certificate of Residency',
    2: 'Certificate of Indigency'
}

export const OTHER_REASON_VALUE = 'other'
export const RESIDENT_SEARCH_LIMIT = 8
export const DEFAULT_DOCUMENT_TYPE = '0'
export const PREVIEW_EMPTY_STATUS = 'No document generated yet'

export const REASON_OPTIONS = {
    medical: {
        label: 'Medical Assistance',
        checkboxIds: ['option-medical-asst']
    },
    financial: {
        label: 'Financial Assistance',
        checkboxIds: ['option-finance-asst']
    },
    food: {
        label: 'Food Assistance',
        checkboxIds: ['option-food-asst']
    },
    scholarship: {
        label: 'Scholarship',
        checkboxIds: ['option-scholarship']
    },
    education: {
        label: 'Educational Assistance',
        checkboxIds: ['option-educ-asst']
    },
    funeral: {
        label: 'Funeral/Burial Assistance',
        checkboxIds: ['option-funeral-asst']
    },
    soloParentPwd: {
        label: 'Solo Parent/PWD Assistance',
        checkboxIds: ['option-solo-parent-pwd']
    },
    residency: {
        label: 'Proof of Residency',
        checkboxIds: ['option-proof-residency']
    },
    orangeCard: {
        label: 'Orange Card',
        checkboxIds: ['option-orange-car']
    },
    other: {
        label: 'Others, please specify',
        checkboxIds: ['option-others']
    }
}
