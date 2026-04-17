export async function checkLogin(username, password) {
    return window.electronAPI.checkLogin(username, password)
}

export async function getData(endpoint) {
    return window.electronAPI.getData(endpoint)
}

export async function postData(endpoint, body) {
    return window.electronAPI.postData(endpoint, body)
}