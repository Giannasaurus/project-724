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

        const result = await window.electronAPI.checkLogin(username.value, password.value)

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
        const data = await window.electronAPI.getData(`/residents/filter?from=${from}&limit=${limit}`)
        const countData = await window.electronAPI.getData('/residents')
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
    attachInhabitantListeners()
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
            attachInhabitantListeners()
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
            loadHistory()
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

function getPageNumbers(current, total) {
    const delta = 1
    const pages = []

    const left = current - 1
    const right = current + 1

    for (let i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= left && i <= right)) {
            pages.push(i)
        }
    }

    const result = []
    let prev = null
    for (const page of pages) {
        if (prev !== null && page - prev > 1) {
            result.push('...')
        }
        result.push(page)
        prev = page
    }

    return result
}

function renderPagination(current, total, onPageChange) {
    const pages = getPageNumbers(current, total)
    const nav = document.getElementById("paginationContainer")
    nav.innerHTML = ''

    const prev = document.createElement("button")
    prev.textContent = '< Previous'
    prev.disabled = current === 1
    prev.addEventListener('click', () => onPageChange(current - 1))
    nav.appendChild(prev)

    const pageNumbers = document.createElement("div")
    pageNumbers.className = 'page-numbers'

    for (const page of pages) {
        if (page === '...') {
            const span = document.createElement("span")
            span.textContent = '...'
            pageNumbers.appendChild(span)
        }
        else {
            const btn = document.createElement("button")
            btn.textContent = page
            btn.classList.toggle('active', page === current)
            btn.addEventListener('click', () => onPageChange(page))
            pageNumbers.appendChild(btn)
        }
    }

    nav.appendChild(pageNumbers)

    const next = document.createElement("button")
    next.textContent = 'Next >'
    next.disabled = current === total
    next.addEventListener('click', () => onPageChange(current + 1))
    nav.appendChild(next)
}

function attachInhabitantListeners() {
    const searchBar = document.getElementById('searchBar')
    searchBar.addEventListener('input', () => {
        const query = searchBar.value.toLowerCase()
        document.querySelectorAll('#dataContainer tbody tr').forEach(row => {
            row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none'
        })
    })

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
            addResidentHistoryLog(result.data)
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

function getResidentFullName(resident) {
    const middleInitial = resident.middleName ? `${resident.middleName[0]}.` : ''
    return `${resident.lastName}, ${resident.firstName} ${middleInitial}`.trim()
}

function readResidentHistory() {
    try {
        const rawHistory = localStorage.getItem(RESIDENT_HISTORY_KEY)
        return rawHistory ? JSON.parse(rawHistory) : []
    }
    catch (error) {
        console.error('Failed to read resident history.', error)
        return []
    }
}

function writeResidentHistory(history) {
    localStorage.setItem(RESIDENT_HISTORY_KEY, JSON.stringify(history))
}

function addResidentHistoryLog(resident) {
    const history = readResidentHistory()
    const log = {
        id: `${Date.now()}-${resident.residentId}`,
        type: 'resident-added',
        residentId: resident.residentId,
        residentName: getResidentFullName(resident),
        address: resident.address,
        createdAt: new Date().toISOString()
    }

    history.unshift(log)
    writeResidentHistory(history.slice(0, 100))
}

function loadHistory() {
    const historyContainer = document.getElementById('historyContainer')
    if (!historyContainer) return

    const history = readResidentHistory()
    historyContainer.innerHTML = ''

    if (history.length === 0) {
        historyContainer.innerHTML = '<p class="history-empty">No resident history yet.</p>'
        return
    }

    const table = document.createElement('table')
    table.id = 'historyTable'

    const tableHeader = document.createElement('thead')
    const headerRow = document.createElement('tr')
    const fieldNames = ['Date', 'Activity', 'Resident', 'Address']

    fieldNames.forEach(field => {
        const th = document.createElement('th')
        th.textContent = field
        headerRow.appendChild(th)
    })

    tableHeader.appendChild(headerRow)

    const tableBody = document.createElement('tbody')
    history.forEach(log => {
        const row = document.createElement('tr')
        const createdAt = new Date(log.createdAt)
        const cells = [
            createdAt.toLocaleString(),
            'Added resident',
            log.residentName,
            log.address
        ]

        cells.forEach(value => {
            const td = document.createElement('td')
            td.textContent = value
            row.appendChild(td)
        })

        tableBody.appendChild(row)
    })

    table.append(tableHeader, tableBody)
    historyContainer.appendChild(table)
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

async function loadData(result) {
    const fieldNames = ["Full Name", "Suffix", "Birthdate", "Sex", "Sector", "Civil Status", "Address", ""]
    const columnClasses = [
        'col-name',
        'col-suffix',
        'col-birthdate',
        'col-sex',
        'col-sector',
        'col-civilstatus',
        'col-address',
        'col-action'
    ]
    const dataContainer = document.getElementById('dataContainer')
    dataContainer.innerHTML = ''

    if (!result.success) {
        console.error(result.message)
        dataContainer.innerHTML = "<p>Error loading residents.</p>"
        return
    }

    const table = document.createElement('table')
    table.setAttribute('id', 'testDataTable')

    const colGroup = document.createElement('colgroup')
    columnClasses.forEach(className => {
        const col = document.createElement('col')
        col.className = className
        colGroup.appendChild(col)
    })

    const tableHeader = document.createElement('thead')
    const headerRow = document.createElement('tr')
    fieldNames.forEach(field => {
        const th = document.createElement('th')
        th.textContent = field
        headerRow.appendChild(th)
    })
    tableHeader.appendChild(headerRow)

    const tableBody = document.createElement('tbody')
    result.data.forEach(resident => {
        const row = document.createElement('tr')
        const middleInitial = resident.middleName ? `${resident.middleName[0]}.` : ''
        const fullName = `${resident.lastName}, ${resident.firstName} ${middleInitial}`
        const entry = [fullName, resident.suffix, resident.birthDate, resident.sex, resident.sector, resident.civilStatus, resident.address]

        const sexes = { 0: "Male", 1: "Female" }
        const sectors = { 0: "General", 1: "Senior", 2: "PWD" }
        const civilStatuses = { 0: "Single", 1: "Married", 2: "Widowed", 3: "Divorced", 4: "Annulled", 5: "Legally Separated" }

        const cells = [
            { value: fullName, class: 'col-name' },
            { value: resident.suffix, class: 'col-suffix' },
            { value: resident.birthDate, class: 'col-birthdate' },
            { value: sexes[resident.sex], class: 'col-sex' },
            { value: sectors[resident.sector], class: 'col-sector' },
            { value: civilStatuses[resident.civilStatus], class: 'col-civilstatus' },
            { value: resident.address, class: 'col-address' },
        ]

        cells.forEach(cell => {
            const td = document.createElement('td')
            td.textContent = cell.value
            td.className = cell.class
            row.appendChild(td)
        })

        const actionTd = document.createElement('td')
        actionTd.className = 'col-action'
        actionTd.innerHTML = `
            <div class="row-action">
                <button class="ellipsis-btn">•••</button>
                <div class="context-menu">
                    <button>Edit</button>
                    <hr class="context-menu-divider">
                    <button>Delete</button>
                </div>
            </div>
        `
        actionTd.querySelector('.ellipsis-btn').addEventListener('click', (e) => {
            e.stopPropagation()
            const rowAction = actionTd.querySelector('.row-action')
            const isOpen = rowAction.classList.contains('open')
            document.querySelectorAll('.row-action.open').forEach(el => el.classList.remove('open'))
            if (!isOpen) rowAction.classList.add('open')
        })

        row.appendChild(actionTd)
        tableBody.appendChild(row)
    })

    table.append(colGroup, tableHeader, tableBody)
    dataContainer.appendChild(table)
}
// async function loadTestData(datafile) {
//     const fieldNames = ["Index", "Inhabitant Name", "Birthdate", "Sex", "Civil Status", "Sector"]
//     const dataContainer = document.getElementById('dataContainer')
//     dataContainer.innerHTML = ''
//     try {
//         const response = await fetch(datafile)
//         if (!response.ok) throw new Error(response.status)
//         const data = await response.json()
//         console.log("Fetched test data from data.json")
//         const table = document.createElement('table')
//         table.setAttribute('id', 'testDataTable')
//         const tableHeader = document.createElement('thead')
//         fieldNames.forEach(field => {
//             const th = document.createElement('th')
//             th.textContent = field
//             tableHeader.appendChild(th)
//         })
//         const tableBody = document.createElement('tbody')
//         data.forEach(resident => {
//             const row = document.createElement('tr')
//             const fullName = `${resident.LastName}, ${resident.FirstName} ${resident.MiddleName}`
//             const entry = [resident.id, fullName, resident.BirthDate, resident.Gender, resident.CivilStatus, resident.Sector]
//             entry.forEach(cell => {
//                 const td = document.createElement('td')
//                 td.textContent = cell
//                 row.appendChild(td)
//             })
//             tableBody.appendChild(row)
//         })
//         table.append(tableHeader, tableBody)
//         dataContainer.appendChild(table)
//     }
//     catch (error) {
//         console.error("Cannot fetch test data.", error)
//         dataContainer.innerHTML = "<p>Error loading test data.</p>"
//     }
// }

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


