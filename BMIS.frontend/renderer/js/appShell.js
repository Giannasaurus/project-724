import { checkLogin, getData } from './core/api.js'
import { loadView } from './core/viewLoader.js'
import { loadHistory, addResidentHistoryLog } from './features/activityLog/activityLogPage.js'
import { renderHomeSummary } from './features/home/homePage.js'
import { openAddResidentForm } from './features/residents/residentForm.js'
import { handleSearchInput, loadData } from './features/residents/residentsPage.js'
import { renderPagination } from './features/residents/residentsPagination.js'

const RESIDENT_HISTORY_KEY = 'bmisResidentHistory'
const DEFAULT_PAGE_SIZE = 50

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
        file: 'views/households.html'
    },
    templates: {
        file: 'views/document-requests.html'
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
        currentView: 'inhabitantList',
        currentPage: 1,
        totalPages: 1
    }

    bindNav(state, app)
    bindSettingsDialog()
    await renderView(state, 'inhabitantList')
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

        if (navLink.id === state.currentView) return
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
    await goToResidentsPage(state, state.currentPage)
    handleSearchInput({
        loadData,
        goToPage: page => goToResidentsPage(state, page)
    })
    attachAddResidentButton(state)
}

async function goToResidentsPage(state, page) {
    state.currentPage = page

    const from = (page - 1) * DEFAULT_PAGE_SIZE
    const data = await getData(`/residents/filter?from=${from}&limit=${DEFAULT_PAGE_SIZE}`)
    const countData = await getData('/residents')

    if (countData.success) {
        state.totalPages = Math.ceil(countData.data.length / DEFAULT_PAGE_SIZE)
    }

    await loadData(data)
    renderPagination(state.currentPage, state.totalPages, nextPage => goToResidentsPage(state, nextPage))

    return data
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
