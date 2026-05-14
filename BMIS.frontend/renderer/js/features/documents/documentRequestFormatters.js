export function getResidentFullName(resident) {
    const middleInitial = resident.middleName ? `${resident.middleName[0]}.` : ''
    return `${resident.lastName}, ${resident.firstName} ${middleInitial} ${resident.suffix ?? ''}`.trim()
}

export function getResidentId(resident) {
    return resident?.residentId ?? resident?.ResidentId ?? resident?.id
}

export function slugify(value) {
    return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
}
