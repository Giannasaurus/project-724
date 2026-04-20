import { checkLogin, getData } from './utils/api.js'
import { loadData } from './utils/inhabitantsList.js'
import { renderPagination, initInhabitantListeners } from './utils/pagination.js'
import { addResidentDeletedHistoryLog, addResidentHistoryLog, loadHistory } from './utils/history.js'

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
        console.log(data)
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

    // FOR LOADING DEFAULT PAGE
    await fetchFile("inhabitantList.html", mainBody)
    await goToPage(1)
    initInhabitantListeners({ handleCloseOnBackdrop, addResidentHistoryLog: resident => addResidentHistoryLog(RESIDENT_HISTORY_KEY, resident), loadData: loadInhabitantData })
    let currentView = 'inhabitantList'
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
            await fetchFile('home.html', mainBody)
            // await loadSummary(data)
        }
        else if (target.closest('#inhabitantList')) {
            if (currentView === 'inhabitantList') return
            currentView = 'inhabitantList'
            setActiveNav(currentView)

            await fetchFile('inhabitantList.html', mainBody)
            await goToPage(1)
            initInhabitantListeners({ handleCloseOnBackdrop, addResidentHistoryLog: resident => addResidentHistoryLog(RESIDENT_HISTORY_KEY, resident), loadData: loadInhabitantData })
        }
        else if (target.closest('#templates')) {
            if (currentView === 'templates') return
            currentView = 'templates'
            setActiveNav(currentView)
            await fetchFile('templates.html', mainBody)
        }
        else if (target.closest('#history')) {
            if (currentView === 'history') return
            currentView = 'history'
            setActiveNav(currentView)
            await fetchFile('history.html', mainBody)
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

async function loadSummary(result) {
    const newInhabitants = document.getElementById('newInhabitants')
    const newRequested = document.getElementById('newRequested')
    const totalHouseholds = document.getElementById('totalHouseholds')
    const totalSectors = document.getElementById('totalSectors')
    const totalMales = document.getElementById('totalMales')
    const totalFemales = document.getElementById('totalFemales')
    const totalRegisteredVoters = document.getElementById('totalRegisteredVoters')

    const totalInhabitants = result.data.length

    const pwdsSeniors = result.data.filter(r => r.sector === 1 || r.sector === 2).length
    totalSectors.textContent = pwdsSeniors
    const males = result.data.filter(r => r.sex === 0).length
    totalMales.textContent = males
    const females = result.data.filter(r => r.sex === 1).length
    totalFemales.textContent = females
}

async function fetchFile(file, container) {
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

document.addEventListener('click', () => {
    document.querySelectorAll('.row-action.open').forEach(el => el.classList.remove('open'))
})

export { RESIDENT_HISTORY_KEY }
