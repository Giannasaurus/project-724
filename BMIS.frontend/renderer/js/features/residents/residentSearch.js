import { getData } from '../../core/api.js'
import { getResidentFullName } from '../../shared/residentUtils.js'
import { mergeResidentExtras } from './residentBackendAdapter.js'

export function residentMatchesNameQuery(resident, query) {
    const normalizedQuery = query?.trim().toLowerCase() ?? ''
    if (!normalizedQuery) return true

    const searchableText = [
        getResidentFullName(resident, { includeSuffix: false }),
        getResidentFullName(resident, { includeSuffix: true }),
        resident.firstName,
        resident.middleName,
        resident.lastName,
        resident.suffix
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

    const tokens = normalizedQuery.split(/\s+/).filter(Boolean)
    return tokens.every(token => searchableText.includes(token))
}

export async function searchResidentsByName(query, options = {}) {
    const trimmedQuery = query?.trim() ?? ''
    const from = options.from ?? 0
    const limit = options.limit ?? 50

    if (!trimmedQuery) {
        return {
            success: true,
            data: [],
            filteredData: []
        }
    }

    return searchResidentsByNameFields(trimmedQuery, { from, limit, filters: options.filters ?? {} })
}

async function searchResidentsByNameFields(query, options) {
    const from = options.from ?? 0
    const limit = options.limit ?? 50
    const allResponse = mergeResidentExtras(await getData('/residents'))

    if (!allResponse?.success || !Array.isArray(allResponse.data)) {
        return allResponse ?? { success: false, data: [], filteredData: [] }
    }

    const filteredResidents = allResponse.data.filter(resident => residentMatchesNameQuery(resident, query))
    const rankedResidents = rankResidentsByQuery(filteredResidents, query)

    return {
        success: true,
        data: rankedResidents.slice(from, from + limit),
        filteredData: rankedResidents
    }
}

function rankResidentsByQuery(residents, query) {
    const normalizedQuery = query.trim().toLowerCase()
    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean)

    return [...residents].sort((left, right) => {
        const leftScore = getResidentMatchScore(left, normalizedQuery, queryTokens)
        const rightScore = getResidentMatchScore(right, normalizedQuery, queryTokens)

        if (leftScore !== rightScore) return rightScore - leftScore

        return getResidentFullName(left, { includeSuffix: false })
            .localeCompare(getResidentFullName(right, { includeSuffix: false }), undefined, { sensitivity: 'base' })
    })
}

function getResidentMatchScore(resident, normalizedQuery, queryTokens) {
    const lastName = String(resident.lastName ?? '').toLowerCase()
    const firstName = String(resident.firstName ?? '').toLowerCase()
    const fullName = getResidentFullName(resident, { includeSuffix: false }).toLowerCase()

    let score = 0

    if (lastName.startsWith(normalizedQuery)) score += 120
    if (firstName.startsWith(normalizedQuery)) score += 110
    if (fullName.startsWith(normalizedQuery)) score += 100

    if (lastName.includes(normalizedQuery)) score += 80
    if (firstName.includes(normalizedQuery)) score += 70
    if (fullName.includes(normalizedQuery)) score += 60

    queryTokens.forEach((token) => {
        if (lastName.startsWith(token)) score += 40
        if (firstName.startsWith(token)) score += 35
        if (lastName.includes(token)) score += 20
        if (firstName.includes(token)) score += 15
    })

    return score
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
