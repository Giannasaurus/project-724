import { checkLogin, getData } from './utils/api.js'
import { renderPagination, initInhabitantListeners } from './utils/residents.js'
import { addResidentHistoryLog, loadHistory } from './utils/history.js'

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

    async function goToPage(page) {
        currentPage = page
        const from = (page - 1) * limit
        const data = await getData(`/residents/filter?from=${from}&limit=${limit}`)
        const countData = await getData('/residents')
        if (countData.success) {
            totalPages = Math.ceil(countData.data.length / limit)
        }
        await loadData(data)
        renderPagination(currentPage, totalPages, goToPage)

        return data
    }

    const mainNav = document.getElementById('mainNav')
    const mainBody = document.getElementById('mainBody')
    const settingsDialog = document.getElementById('settingsDialog')
    const closeBtns = document.querySelectorAll('.closeBtn')

    // FOR LOADING DEFAULT PAGE
    await fetchFile("inhabitantList.html", mainBody)
    await goToPage(1)
    initInhabitantListeners({ handleCloseOnBackdrop, addResidentHistoryLog: resident => addResidentHistoryLog(RESIDENT_HISTORY_KEY, resident), loadData })
    // await fetchFile("home.html", mainBody)
    // await loadSummary(data)

    let currentView = null
    mainNav.addEventListener('click', async (e) => {
        const target = e.target

        if (target.closest('#home')) {
            if (currentView === 'home') return
            currentView = 'home'
            await fetchFile('home.html', mainBody)
            // await loadSummary(data)
        }
        else if (target.closest('#inhabitantList')) {
            if (currentView === 'inhabitantList') return
            currentView = 'inhabitantList'

            await fetchFile('inhabitantList.html', mainBody)
            await goToPage(1)
            initInhabitantListeners({ handleCloseOnBackdrop, addResidentHistoryLog: resident => addResidentHistoryLog(RESIDENT_HISTORY_KEY, resident), loadData })
        }
        else if (target.closest('#templates')) {
            if (currentView === 'templates') return
            currentView = 'templates'
            await fetchFile('templates.html', mainBody)
        }
        else if (target.closest('#history')) {
            if (currentView === 'history') return
            currentView = 'history'
            await fetchFile('history.html', mainBody)
            loadHistory(RESIDENT_HISTORY_KEY)
        }
        else if (target.closest('#settings')) {
            settingsDialog.showModal()
        }
        else if (target.matches('#logout')) {
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

async function searchInhabitants() {
    const searchBar = document.getElementById('searchBar');

    /*
     * TODO:
     *  
     *  implement filter menu in inhabitantList.html
     *  get all data that the user will input
     *  use the api/residents/filter[?params]
     *
     *
     * const filter = document.getElementById('');
     *
     *
     *
    */
    
    // sample filter
    console.log(`/residents/filter?firstName=${searchBar.value}`);
    var data = await window.electronAPI.getData(`/residents/filter?firstName=${searchBar.value}`);
    return data;

    /*

    searchBar.addEventListener('input', () => {
        const query = searchBar.value.toLowerCase()
        document.querySelectorAll('#dataContainer tbody tr').forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none'
        })
    })

    */
} 

async function displayInhabitants() {
    var data = await searchInhabitants();
    console.log(data);
    await loadData(data);
}

function attachInhabitantListeners() {
    const searchBtn = document.getElementById('btn_search');
    
    searchBtn.addEventListener('click', displayInhabitants);

    const addResidentBtn = document.getElementById('addResidentBtn')
    const addResidentDialog = document.getElementById('addResidentDialog')
    
    addResidentBtn.addEventListener('click', () => {
        document.getElementById('addResidentForm').reset()
        document.getElementById('ar-error').textContent = ''
        addResidentDialog.showModal()
        addResidentDialog.addEventListener('click', handleCloseOnBackdrop, { once: true })
    })

    document.getElementById('addResidentForm').addEventListener('submit', async (e) => {
        e.preventDefault()
        const errorEl = document.getElementById('ar-error')
        errorEl.textContent = ''

        const firstName = document.getElementById('ar-firstName').value.trim()
        const middleName = document.getElementById('ar-middleName').value.trim()
        const lastName = document.getElementById('ar-lastName').value.trim()
        const address = document.getElementById('ar-address').value.trim()
        const day = document.getElementById('ar-bday').value.padStart(2, '0')
        const month = String(document.getElementById('ar-bmonth').value).padStart(2, '0')
        const year = document.getElementById('ar-byear').value

        if (!firstName || !middleName || !lastName || !address || !day || !year) {
            errorEl.textContent = 'Please fill in all required fields.'
            return
        }

        const payload = {
            firstName,
            middleName,
            lastName,
            suffix: document.getElementById('ar-suffix').value.trim(),
            birthDate: `${year}-${month}-${day}`,
            sex: parseInt(document.getElementById('ar-sex').value),
            sector: parseInt(document.getElementById('ar-sector').value),
            civilStatus: parseInt(document.getElementById('ar-civilStatus').value),
            address
        }

        const saveBtn = document.getElementById('ar-saveBtn')
        saveBtn.disabled = true
        saveBtn.textContent = 'Saving...'

        const result = await window.electronAPI.postData('/residents', payload)

        saveBtn.disabled = false
        saveBtn.textContent = 'Save'

        if (result.success) {
            addResidentDialog.close()
            const freshData = await window.electronAPI.getData('/residents')
            await loadData(freshData)
        } else {
            errorEl.textContent = 'Failed to save resident. Please try again.'
            console.error(result.message)
        }
    })

    const closeBtns = document.querySelectorAll('#addResidentDialog .closeBtn')
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const dialog = btn.closest('dialog')
            if (dialog) dialog.close()
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

    if (clickedInDialog === false) dialog.close();
    console.log("Dialog close on backdrop click")
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
