const AUTH_SESSION_KEY = 'bmisAuthSession'

const ROLE_PERMISSIONS = {
    Admin: new Set([
        'addResidents',
        'editResidents',
        'importResidents',
        'requestDocuments',
        'viewActivityLog',
        'manageSettings'
    ]),
    Kagawad: new Set([
        'requestDocuments'
    ])
}

const VIEW_PERMISSIONS = {
    history: 'viewActivityLog',
    settings: 'manageSettings'
}

export function getCurrentUserRole() {
    try {
        const session = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) ?? '{}')
        return session.role === 'Kagawad' ? 'Kagawad' : 'Admin'
    }
    catch {
        return 'Admin'
    }
}

export function hasPermission(permission, role = getCurrentUserRole()) {
    return ROLE_PERMISSIONS[role]?.has(permission) ?? false
}

export function canAccessView(viewId, role = getCurrentUserRole()) {
    const permission = VIEW_PERMISSIONS[viewId]
    return permission ? hasPermission(permission, role) : true
}

export function applyPermissionState(element, permission, options = {}) {
    if (!element) return false

    const allowed = hasPermission(permission)
    element.disabled = !allowed
    element.setAttribute('aria-disabled', String(!allowed))
    element.classList.toggle('is-permission-disabled', !allowed)
    if (!allowed) element.title = options.title ?? 'Admin permission required.'

    return allowed
}
