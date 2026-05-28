import { mergeResidentExtras } from '../features/residents/residentBackendAdapter.js'

export async function getData(endpoint) {
    const response = await window.electronAPI.getData(endpoint)
    return isResidentEndpoint(endpoint) ? mergeResidentExtras(response) : response
}

export async function postData(endpoint, body) {
    return window.electronAPI.postData(endpoint, body)
}

export async function updateData(endpoint, body) {
    return window.electronAPI.updateData(endpoint, body)
}

export async function readResidentsExcel() {
    return window.electronAPI.readResidentsExcel()
}

function isResidentEndpoint(endpoint = '') {
    return endpoint.replace(/^\//, '').startsWith('residents')
}
