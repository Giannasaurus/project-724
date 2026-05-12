import { getData, postData } from '../../core/api.js'

export async function searchResidentsByName(query, options = {}) {
    const trimmedQuery = query?.trim() ?? ''
    const from = options.from ?? 0
    const limit = options.limit ?? 50

    if (!trimmedQuery) {
        return {
            success: true,
            data: []
        }
    }

    const searchResult = await postData(`/residents/search?${getPagingParams(from, limit).toString()}`, {
        name: trimmedQuery
    })

    if (searchResult?.success && Array.isArray(searchResult.data)) {
        return searchResult
    }

    console.error(searchResult?.message ?? 'Resident search endpoint failed.')
    return searchResidentsByNameFields(trimmedQuery, { from, limit })
}

async function searchResidentsByNameFields(query, options) {
    const fields = ['firstName', 'middleName', 'lastName']
    const responses = await Promise.all(fields.map((field) => {
        const params = getPagingParams(options.from, options.limit)
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

function getPagingParams(from, limit) {
    return new URLSearchParams({
        from: String(from),
        limit: String(limit)
    })
}

function getResidentId(resident) {
    return resident.residentId ?? resident.ResidentId ?? resident.id
}
