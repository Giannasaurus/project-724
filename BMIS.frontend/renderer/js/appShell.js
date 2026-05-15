import { getData } from './core/api.js'
import { loadView } from './core/viewLoader.js'
import {
    loadHistory,
    addResidentDeletedHistoryLog,
    addResidentHistoryLog,
    addResidentUpdatedHistoryLog
} from './features/activityLog/activityLogPage.js'
import { initDocumentRequestsPage } from './features/documents/documentRequestsPage.js'
import { renderHomeSummary } from './features/home/homePage.js'
import { initHouseholdsPage } from './features/households/householdsPage.js'
import { getFilteredResidentPageData, hasActiveResidentFilters } from './features/residents/residentFilters.js'
import { openAddResidentForm } from './features/residents/residentForm.js'
import { bindResidentImportControls } from './features/residents/residentImport.js'
import { bindResidentFilterControls, handleSearchInput, loadData, renderFilterIndicators } from './features/residents/residentsPage.js'
import { renderPagination } from './features/residents/residentsPagination.js'
import { getResidentQueryParams, searchResidentsByName } from './features/residents/residentSearch.js'
import { initSettingsPage } from './features/settings/settingsPage.js'

const RESIDENT_HISTORY_KEY = 'bmisResidentHistory'
const AUTH_SESSION_KEY = 'bmisAuthSession'
const AUTH_CREDENTIALS_KEY = 'bmis'
const DEFAULT_AUTH_CREDENTIALS = {
    username: 'user',
    password: 'password'
}
const DEFAULT_PAGE_SIZE = 50
const DEFAULT_VIEW = 'home'

const views = {
    home: {
        file: 'views/home.html',
        afterRender: async () => {
            const summaryData = await getData('/residents')
            renderHomeSummary(summaryData)
        }
    },
    inhabitantList: {
        file: 'views/residents.html',
        afterRender: showResidentsView
    },
    household: {
        file: 'views/households.html',
        afterRender: initHouseholdsPage
    },
    templates: {
        file: 'views/document-requests.html',
        afterRender: showDocumentRequestsView
    },
    history: {
        file: 'views/activity-log.html',
        afterRender: () => loadHistory(RESIDENT_HISTORY_KEY)
    },
    settings: {
        file: 'views/settings.html',
        afterRender: initSettingsPage
    }
}

export async function loadInitialView(app) {
    ensureStoredCredentials()

    if (isLoggedIn()) {
        await loadApp(app)
        return
    }

    await loadLogin(app)
}

export async function loadLogin(app) {
    await loadView('views/login.html', app)

    const loginForm = document.getElementById('loginForm')
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault()

        const username = document.getElementById('usernameInput')
        const password = document.getElementById('passwordInput')
        const loginErrorMessage = document.getElementById('loginErrorMessage')

        if (isValidLogin(username.value, password.value)) {
            saveLoginSession(username.value)
            await loadApp(app)
            return
        }

        loginErrorMessage.textContent = 'Incorrect username/password'
    })
}

export async function loadApp(app) {
    await loadView('views/app.html', app)

    const state = {
        currentView: DEFAULT_VIEW,
        currentPage: 1,
        totalPages: 1,
        residentFilters: {},
        residentSearchQuery: '',
        documentRequestResident: null
    }

    bindNav(state, app)
    await renderView(state, DEFAULT_VIEW)
}

function bindNav(state, app) {
    const mainNav = document.getElementById('mainNav')

    mainNav.addEventListener('click', async (event) => {
        const navLink = event.target.closest('.sub-main-nav-a')
        if (!navLink) return

        event.preventDefault()

        if (navLink.id === 'logout') {
            clearLoginSession()
            await loadLogin(app)
            return
        }

        if (navLink.id === state.currentView) {
            if (navLink.id === 'templates') {
                state.documentRequestResident = null
                await renderView(state, navLink.id)
            }

            return
        }

        if (navLink.id === 'templates') state.documentRequestResident = null
        await renderView(state, navLink.id)
    })
}

async function renderView(state, viewId) {
    const view = views[viewId]
    const mainBody = document.getElementById('mainBody')
    if (!view || !mainBody) return

    state.currentView = viewId
    setActiveNav(viewId)

    await loadView(view.file, mainBody)
    await view.afterRender?.(state)
}

async function showResidentsView(state) {
    const renderResidentData = data => loadData(data, {
        onDocumentRequest: resident => openDocumentRequestsForResident(state, resident),
        showResidentsView: () => returnToResidentsView(state, state.currentPage)
    })

    await goToResidentsPage(state, state.currentPage)
    handleSearchInput({
        onSearch: query => searchResidentsView(state, query),
        goToPage: page => goToResidentsPage(state, page)
    })
    bindResidentFilterControls({
        getFilters: () => state.residentFilters,
        onApplyFilters: filters => applyResidentFilters(state, filters),
        onClearFilters: () => clearResidentFilters(state)
    })
    renderFilterIndicators(state.residentFilters, {
        onApplyFilters: filters => applyResidentFilters(state, filters),
        onClearFilters: () => clearResidentFilters(state)
    })
    attachAddResidentButton(state)
    bindResidentImportControls({
        addResidentHistoryLog: resident => addResidentHistoryLog(RESIDENT_HISTORY_KEY, resident),
        showResidentsView: page => returnToResidentsView(state, page)
    })
}

async function goToResidentsPage(state, page) {
    state.currentPage = page

    const from = (page - 1) * DEFAULT_PAGE_SIZE
    const filters = state.residentFilters
    const query = state.residentSearchQuery
    const shouldFilterClientSide = hasActiveResidentFilters(filters)
    const data = shouldFilterClientSide
        ? await getFilteredResidentPageData(query, filters, from, DEFAULT_PAGE_SIZE)
        : query
            ? await searchResidentsByName(query, { from, limit: DEFAULT_PAGE_SIZE, filters })
            : await getData(`/residents/filter?${getResidentQueryParams({ from, limit: DEFAULT_PAGE_SIZE, filters }).toString()}`)
    const countData = shouldFilterClientSide
        ? { success: data.success, data: data.filteredData ?? data.data }
        : await getResidentCountData(query, filters)

    if (countData.success) {
        state.totalPages = Math.max(1, Math.ceil(countData.data.length / DEFAULT_PAGE_SIZE))
    }

    await loadData(data, {
        addDeletedHistoryLog: resident => addResidentDeletedHistoryLog(RESIDENT_HISTORY_KEY, resident),
        addUpdatedHistoryLog: resident => addResidentUpdatedHistoryLog(RESIDENT_HISTORY_KEY, resident),
        onDocumentRequest: resident => openDocumentRequestsForResident(state, resident),
        showResidentsView: () => returnToResidentsView(state, state.currentPage)
    })
    renderPagination(state.currentPage, state.totalPages, nextPage => goToResidentsPage(state, nextPage))

    return data
}

async function searchResidentsView(state, query) {
    state.residentSearchQuery = query
    await goToResidentsPage(state, 1)
}

async function applyResidentFilters(state, filters) {
    state.residentFilters = filters
    await goToResidentsPage(state, 1)
    renderFilterIndicators(state.residentFilters, {
        onApplyFilters: filters => applyResidentFilters(state, filters),
        onClearFilters: () => clearResidentFilters(state)
    })
}

async function clearResidentFilters(state) {
    state.residentFilters = {}
    await goToResidentsPage(state, 1)
    renderFilterIndicators(state.residentFilters, {
        onApplyFilters: filters => applyResidentFilters(state, filters),
        onClearFilters: () => clearResidentFilters(state)
    })
}

async function getResidentCountData(query, filters) {
    if (query) {
        return searchResidentsByName(query, {
            from: 0,
            limit: 10000,
            filters
        })
    }

    const params = getResidentQueryParams({ filters })
    const endpoint = params.toString() ? `/residents/filter?${params.toString()}` : '/residents'
    return getData(endpoint)
}

function showDocumentRequestsView(state) {
    initDocumentRequestsPage({
        selectedResident: state.documentRequestResident
    })
}

async function openDocumentRequestsForResident(state, resident) {
    state.documentRequestResident = resident
    await renderView(state, 'templates')
}

function attachAddResidentButton(state) {
    const addResidentBtn = document.getElementById('addResidentBtn')
    const residentsView = document.getElementById('iLView')
    if (!addResidentBtn || !residentsView) return

    addResidentBtn.onclick = async () => {
        await openAddResidentForm({
            ilView: residentsView,
            addResidentHistoryLog: resident => addResidentHistoryLog(RESIDENT_HISTORY_KEY, resident),
            showResidentsView: page => returnToResidentsView(state, page)
        })
    }
}

async function returnToResidentsView(state, page = 1) {
    state.currentPage = page
    await renderView(state, 'inhabitantList')
}

function setActiveNav(id) {
    const mainNav = document.getElementById('mainNav')
    mainNav.querySelectorAll('.sub-main-nav-a.active').forEach(link => link.classList.remove('active'))
    mainNav.querySelector(`#${id}`)?.classList.add('active')
}

export function closeOpenRowActions() {
    document.querySelectorAll('.row-action.open').forEach(element => element.classList.remove('open'))
}

function isLoggedIn() {
    try {
        const session = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY) ?? '{}')
        return session?.isLoggedIn === true
    }
    catch {
        return false
    }
}

function isValidLogin(username, password) {
    const credentials = getStoredCredentials()

    return username.trim() === credentials.username && password === credentials.password
}

function getStoredCredentials() {
    return ensureStoredCredentials()
}

function ensureStoredCredentials() {
    try {
        const storedCredentials = JSON.parse(localStorage.getItem(AUTH_CREDENTIALS_KEY) ?? '{}')
        if (storedCredentials?.username && storedCredentials?.password) {
            return storedCredentials
        }
    }
    catch {
        localStorage.removeItem(AUTH_CREDENTIALS_KEY)
    }

    localStorage.setItem(AUTH_CREDENTIALS_KEY, JSON.stringify(DEFAULT_AUTH_CREDENTIALS))
    return DEFAULT_AUTH_CREDENTIALS
}

function saveLoginSession(username) {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({
        isLoggedIn: true,
        username: username.trim(),
        loggedInAt: new Date().toISOString()
    }))
}

function clearLoginSession() {
    localStorage.removeItem(AUTH_SESSION_KEY)
    localStorage.removeItem('isLoggedIn')
}
