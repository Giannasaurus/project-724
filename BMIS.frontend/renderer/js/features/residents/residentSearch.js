import { getData } from '../../core/api.js'

export async function searchResidentsByName(query, options = {}) {
    const trimmedQuery = query?.trim() ?? ''
    const from = options.from ?? 0
    const limit = options.limit ?? 50
    const filters = options.filters ?? {}

    if (!trimmedQuery) {
        return {
            success: true,
            data: []
        }
    }

    return searchResidentsByNameFields(trimmedQuery, { from, limit, filters })
}

async function searchResidentsByNameFields(query, options) {
    const fields = ['firstName', 'middleName', 'lastName']
    const responses = await Promise.all(fields.map((field) => {
        const params = getResidentQueryParams(options)
        params.set(field, query)

        return getData(`/residents/filter?${params.toString()}`)
    }))

    const residents = []
    const seenResidentIds = new Set()

    responses.forEach((response) => {
        if (!response?.success || !Array.isArray(response.data)) return

        response.data.forEach((resident) => {
            const residentId = getResidentId(resident) ?? JSON.stringify(resident)
            if (seenResidentIds.has(residentId) || residents.length >= options.limit) return

            seenResidentIds.add(residentId)
            residents.push(resident)
        })
    })

    return {
        success: true,
        data: residents
    }
}

export function getResidentQueryParams(options = {}) {
    const params = new URLSearchParams()
    const filters = options.filters ?? {}

    appendOptionalParam(params, 'minAge', filters.minAge)
    appendOptionalParam(params, 'maxAge', filters.maxAge)
    appendOptionalParam(params, 'order', filters.order)
    appendRepeatedParams(params, 'sex', filters.sex)
    appendRepeatedParams(params, 'sector', filters.sector)
    appendRepeatedParams(params, 'civilStat', filters.civilStat)
    appendOptionalParam(params, 'from', options.from)
    appendOptionalParam(params, 'limit', options.limit)

    return params
}

function appendOptionalParam(params, key, value) {
    if (value === undefined || value === null || value === '') return
    params.set(key, String(value))
}

function appendRepeatedParams(params, key, values) {
    if (!Array.isArray(values)) return

    values.forEach((value) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value))
        }
    })
}

function getResidentId(resident) {
    return resident.residentId ?? resident.ResidentId ?? resident.id
}
