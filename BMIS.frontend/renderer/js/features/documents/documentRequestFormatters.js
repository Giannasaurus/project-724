export { getResidentFullName, getResidentId } from '../../shared/residentUtils.js'

export function slugify(value) {
    return value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
}
