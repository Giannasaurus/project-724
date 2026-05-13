import { checkLogin, getData } from './core/api.js'
import { loadView } from './core/viewLoader.js'
import { loadHistory, addResidentHistoryLog } from './features/activityLog/activityLogPage.js'
import { initDocumentRequestsPage } from './features/documents/documentRequestsPage.js'
import { renderHomeSummary } from './features/home/homePage.js'
import { initHouseholdsPage } from './features/households/householdsPage.js'
import { openAddResidentForm } from './features/residents/residentForm.js'
import { bindResidentFilterControls, handleSearchInput, loadData, renderFilterIndicators } from './features/residents/residentsPage.js'
import { renderPagination } from './features/residents/residentsPagination.js'
import { getResidentQueryParams, searchResidentsByName } from './features/residents/residentSearch.js'

const RESIDENT_HISTORY_KEY = 'bmisResidentHistory'
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
    }
}

export async function loadLogin(app) {
    await loadView('views/login.html', app)

    const loginForm = document.getElementById('loginForm')
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault()

        const username = document.getElementById('usernameInput')
        const password = document.getElementById('passwordInput')
        const loginErrorMessage = document.getElementById('loginErrorMessage')
        const result = await checkLogin(username.value, password.value)

        if (result) {
            localStorage.setItem('isLoggedIn', result)
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
    bindSettingsDialog()
    await renderView(state, DEFAULT_VIEW)
}

function bindNav(state, app) {
    const mainNav = document.getElementById('mainNav')

    mainNav.addEventListener('click', async (event) => {
        const navLink = event.target.closest('.sub-main-nav-a')
        if (!navLink) return

        event.preventDefault()

        if (navLink.id === 'settings') {
            document.getElementById('settingsDialog')?.showModal()
            return
        }

        if (navLink.id === 'logout') {
            localStorage.removeItem('isLoggedIn')
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
}

async function goToResidentsPage(state, page) {
    state.currentPage = page

    const from = (page - 1) * DEFAULT_PAGE_SIZE
    const filters = state.residentFilters
    const query = state.residentSearchQuery
    const data = query
        ? await searchResidentsByName(query, { from, limit: DEFAULT_PAGE_SIZE, filters })
        : await getData(`/residents/filter?${getResidentQueryParams({ from, limit: DEFAULT_PAGE_SIZE, filters }).toString()}`)
    const countData = await getResidentCountData(query, filters)

    if (countData.success) {
        state.totalPages = Math.max(1, Math.ceil(countData.data.length / DEFAULT_PAGE_SIZE))
    }

    await loadData(data, {
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

function bindSettingsDialog() {
    const settingsDialog = document.getElementById('settingsDialog')
    const closeBtns = document.querySelectorAll('.closeBtn')

    settingsDialog.addEventListener('click', closeDialogOnBackdrop)

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('dialog')?.close()
        })
    })
}

function closeDialogOnBackdrop(event) {
    const dialog = event.currentTarget
    const rect = dialog.getBoundingClientRect()
    const clickedInDialog = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
    )

    if (!clickedInDialog) dialog.close()
}

export function closeOpenRowActions() {
    document.querySelectorAll('.row-action.open').forEach(element => element.classList.remove('open'))
}
