const app = document.getElementById('app')

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
    const data = await window.electronAPI.getData('/residents');
    console.log(data)
    
    const mainNav = document.getElementById('mainNav')
    const mainBody = document.getElementById('mainBody')
    const settingsDialog = document.getElementById('settingsDialog')
    const closeBtn = document.getElementById('closeBtn')

    await fetchFile("home.html", mainBody)

    mainNav.addEventListener('click', async (e) => {
        const target = e.target

        if (target.closest('#home')) {
            await fetchFile('home.html', mainBody)
        }
        else if (target.closest('#inhabitantList')) {
            await fetchFile('inhabitantList.html', mainBody)
            const data = await window.electronAPI.getData('/residents')
            console.log(data)
            await loadData(data)

            const searchBar = document.getElementById('searchBar')
            searchBar.addEventListener('input', (e) => {
                const query = searchBar.value.toLowerCase()
                document.querySelectorAll('#dataContainer tbody tr').forEach(row => {
                    row.style.display = row.textContent.toLowerCase().includes(query) ? '' : 'none';
                })
            })
        }
        else if (target.closest('#templates')) {
            await fetchFile('templates.html', mainBody)
        }
        else if (target.closest('#history')) {
            await fetchFile('history.html', mainBody)
        }
        else if (target.closest('#settings')) {
            settingsDialog.showModal()
        }
        else if (target.matches('#logout')) {
            localStorage.clear()
            loadLogin()
        }
    })

    settingsDialog.addEventListener('click', (e) => {
        const rect = settingsDialog.getBoundingClientRect();
        const clickedInDialog = (
            rect.top <= e.clientY &&
            e.clientY <= rect.top + rect.height &&
            rect.left <= e.clientX &&
            e.clientX <= rect.left + rect.width
        );

        if (clickedInDialog === false)
            settingsDialog.close();
    })

    closeBtn.addEventListener('click', () => {
        settingsDialog.close()
    })
}

async function loadData(result) {
    const fieldNames = ["Full Name", "Suffix", "Birthdate", "Sex", "Sector", "Civil Status", "Address"]
    const dataContainer = document.getElementById('dataContainer')
    dataContainer.innerHTML = ''

    if (!result.success) {
        console.error(result.message)
        dataContainer.innerHTML = "<p>Error loading residents.</p>"
        return
    }

    const table = document.createElement('table')
    table.setAttribute('id', 'testDataTable')

    const tableHeader = document.createElement('thead')
    fieldNames.forEach(field => {
        const th = document.createElement('th')
        th.textContent = field
        tableHeader.appendChild(th)
    })

    const tableBody = document.createElement('tbody')
    result.data.forEach(resident => {
        const row = document.createElement('tr')
        const fullName = `${resident.lastName}, ${resident.firstName} ${resident.middleName}`
        const entry = [fullName, resident.suffix, resident.birthDate, resident.sex, resident.sector, resident.civilStatus, resident.address]

        entry.forEach(cell => {
            const td = document.createElement('td')
            td.textContent = cell
            row.appendChild(td)
        })

        tableBody.appendChild(row)
    })

    table.append(tableHeader, tableBody)
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
