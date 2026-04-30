import { checkLogin, getData } from './utils/api.js'
import { loadData } from './utils/residents.js'
import { openAddResidentForm } from './utils/residentForm.js'
import { renderPagination, initInhabitantListeners } from './utils/pagination.js'
import { addResidentDeletedHistoryLog, addResidentHistoryLog, loadHistory } from './utils/activityLog.js'

/** 
 * TODO
 * 
 * 
 * 
 * 
 * a lot 
 */

const app = document.getElementById('app')
const RESIDENT_HISTORY_KEY = 'bmisResidentHistory'

// skip login (dev)
// localStorage.getItem("isLoggedIn") ? loadApp() : loadLogin()

// skip login then load app directly
loadApp();

async function loadLogin() {
    await fetchFile("login.html", app)

    const loginForm = document.getElementById('loginForm')
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()

        const username = document.getElementById('usernameInput')
        const password = document.getElementById('passwordInput')
        const loginErrorMessage = document.getElementById('loginErrorMessage')

        const result = await checkLogin(username.value, password.value)

        if (result) {
            localStorage.setItem('isLoggedIn', result)
            await loadApp()
        }
        else {
            loginErrorMessage.textContent = "Incorrect username/password"
        }
    })
}

async function loadApp() {
    await fetchFile("app.html", app)

    // api request data sample
    let currentPage = 1
    const limit = 50
    let totalPages = 1
    const loadInhabitantData = data => loadData(data, {
        addDeletedHistoryLog: resident => addResidentDeletedHistoryLog(RESIDENT_HISTORY_KEY, resident)
    })

    async function goToPage(page) {
        currentPage = page
        const from = (page - 1) * limit
        const data = await getData(`/residents/filter?from=${from}&limit=${limit}`)
        const countData = await getData('/residents')
        if (countData.success) {
            totalPages = Math.ceil(countData.data.length / limit)
        }
        await loadInhabitantData(data)
        renderPagination(currentPage, totalPages, goToPage)

        return data
    }

    const mainNav = document.getElementById('mainNav')
    const mainBody = document.getElementById('mainBody')
    const settingsDialog = document.getElementById('settingsDialog')
    const closeBtns = document.querySelectorAll('.closeBtn')

    function setActiveNav(id) {
        mainNav.querySelectorAll('.sub-main-nav-a.active').forEach(link => link.classList.remove('active'))
        const activeLink = mainNav.querySelector(`#${id}`)
        if (activeLink) activeLink.classList.add('active')
    }

    async function showResidentsView(page = 1) {
        await fetchFile('./views/residents.html', mainBody)
        await goToPage(page)
        initInhabitantListeners({ loadData: loadInhabitantData })
        attachAddResidentButton()
    }

    // FOR LOADING DEFAULT PAGE
    await showResidentsView(1)
    let currentView = 'inhabitantList'
    console.log(document.getElementById("mainBody"),
        document.getElementById("dataContainer"))
    setActiveNav(currentView)
    // await fetchFile("home.html", mainBody)
    // await loadSummary(data)
    
    mainNav.addEventListener('click', async (e) => {
        const target = e.target
        const navLink = target.closest('.sub-main-nav-a')
        if (navLink) e.preventDefault()

        if (target.closest('#home')) {
            if (currentView === 'home') return
            currentView = 'home'
            setActiveNav(currentView)
            await fetchFile('./views/home.html', mainBody)
            const summaryData = await getData('/residents')
            await loadSummary(summaryData)
        }
        else if (target.closest('#inhabitantList')) {
            if (currentView === 'inhabitantList') return
            currentView = 'inhabitantList'
            setActiveNav(currentView)

            await showResidentsView(1)
        }
        else if (target.closest('#household')) {
            if (currentView === 'household') return
            currentView = 'household'
            setActiveNav(currentView)
            await fetchFile('./views/households.html', mainBody)
        }
        else if (target.closest('#templates')) {
            if (currentView === 'templates') return
            currentView = 'templates'
            setActiveNav(currentView)
            await fetchFile('./views/document-requests.html', mainBody)
        }
        else if (target.closest('#history')) {
            if (currentView === 'history') return
            currentView = 'history'
            setActiveNav(currentView)
            await fetchFile('./views/activity-log.html', mainBody)
            loadHistory(RESIDENT_HISTORY_KEY)
        }
        else if (target.closest('#settings')) {
            settingsDialog.showModal()
        }
        else if (target.closest('#logout')) {
            localStorage.removeItem('isLoggedIn')
            loadLogin()
        }
    })

    settingsDialog.addEventListener('click', (e) => {
        handleCloseOnBackdrop(e)
    })

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const dialog = btn.closest('dialog')
            if (dialog) dialog.close()
            console.log("clicked close button")
        })
    })
}

async function loadSummary(result) {
    const newInhabitants = document.getElementById('newInhabitants')
    const newRequested = document.getElementById('newRequested')
    const totalInhabitantsEl = document.getElementById('totalInhabitants')
    const totalHouseholds = document.getElementById('totalHouseholds')
    const totalSectors = document.getElementById('totalSectors')
    const totalSectorsSecondary = document.getElementById('totalSectorsSecondary')
    const totalMales = document.getElementById('totalMales')
    const totalFemales = document.getElementById('totalFemales')
    const totalRegisteredVoters = document.getElementById('totalRegisteredVoters')
    const homePopulationHealth = document.getElementById('homePopulationHealth')

    if (!result?.success) return

    const totalInhabitants = result.data.length
    if (totalInhabitantsEl) totalInhabitantsEl.textContent = totalInhabitants

    const pwdsSeniors = result.data.filter(r => r.sector === 1 || r.sector === 2).length
    if (totalSectors) totalSectors.textContent = pwdsSeniors
    if (totalSectorsSecondary) totalSectorsSecondary.textContent = pwdsSeniors
    const males = result.data.filter(r => r.sex === 0).length
    if (totalMales) totalMales.textContent = males
    const females = result.data.filter(r => r.sex === 1).length
    if (totalFemales) totalFemales.textContent = females
    if (newInhabitants) newInhabitants.textContent = Math.min(totalInhabitants, 8)
    if (newRequested) newRequested.textContent = Math.max(1, Math.ceil(totalInhabitants / 25))
    if (totalHouseholds) totalHouseholds.textContent = Math.max(1, Math.ceil(totalInhabitants / 4))
    if (totalRegisteredVoters) totalRegisteredVoters.textContent = Math.max(0, Math.floor(totalInhabitants * 0.62))
    if (homePopulationHealth) homePopulationHealth.textContent = totalInhabitants > 0 ? 'Active' : 'No data'
}

function handleCloseOnBackdrop(e) {
    const dialog = e.currentTarget
    const rect = dialog.getBoundingClientRect();
    const clickedInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
    );

    if (!clickedInDialog) dialog.close();
}

export async function fetchFile(file, container) {
    try {
        const response = await fetch(file)
        if (!response.ok) throw new Error(response.status)
        container.innerHTML = await response.text()
        console.log(`Fetched ${file}`)
    }
    catch (error) {
        console.error(`Cannot fetch ${file}`, error)
        container.innerHTML = `<p>Error loading ${file} page.</p>`
    }
}

function attachAddResidentButton() {
    const addResidentBtn = document.getElementById('addResidentBtn')
    const ilView = document.getElementById('iLView')
    if (addResidentBtn && ilView) {
        addResidentBtn.onclick = async () => {
            await openAddResidentForm({
                ilView,
                addResidentHistoryLog,
                showResidentsView: async () => {
                    const freshData = await getData('/residents/filter?from=0&limit=50')
                    await loadData(freshData, options)
                }
            })
        }
    }
}

// move this inside the table only
// first-class event listener 💀💀
document.addEventListener('click', () => {
    document.querySelectorAll('.row-action.open').forEach(el => el.classList.remove('open'))
})

export { RESIDENT_HISTORY_KEY }
