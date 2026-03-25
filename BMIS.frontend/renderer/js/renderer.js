const app = document.getElementById('app')

// skip login (dev)
localStorage.getItem("username") ? loadApp() : loadLogin()

async function loadLogin(file) {
    await fetchFile("login.html", app)

    const loginForm = document.getElementById('loginForm')

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault()

        const username = document.getElementById('usernameInput')
        const password = document.getElementById('passwordInput')
        const loginErrorMessage = document.getElementById('loginErrorMessage')

        const result = await window.electronAPI.checkLogin(username.value, password.value)

        if (result) {
            localStorage.setItem('username', username.value)
            localStorage.setItem('password', password.value)
            loadApp()
        }
        else {
            loginErrorMessage.textContent = "Incorrect username/password"
        }
    })
}

async function loadApp() {
    await fetchFile("app.html", app)
    
    const mainBody = document.getElementById('mainBody')
    const mainNav = document.getElementById('mainNav')
    
    await fetchFile("inhabitantList.html", mainBody)
    loadTestData('testData/data.json')
    
    
    mainNav.addEventListener('click', async (e) => {
        const target = e.target
        
        if (target.matches('#home')) {
            await fetchFile('home.html', mainBody)
        }
        else if (target.matches('#inhabitantList')) {
            await fetchFile('inhabitantList.html', mainBody)
            loadTestData('testData/data.json')
        }
        else if (target.matches('#templates')) {
            await fetchFile('templates.html', mainBody)
        }
        else if (target.matches('#history')) {
            await fetchFile('history.html', mainBody)
        }
        
        if (target.id) console.log(`Switched tab to: ${target.textContent}`)
    })
}

async function loadTestData(datafile) {
    const fieldNames = ["Index", "Inhabitant Name", "Birthdate", "Sex", "Civil Status", "PWD/Senior"]
    const testDataContainer = document.getElementById('testDataContainer')

    try {
        const response = await fetch(datafile)
        if (!response.ok) throw new Error(response.status)
        const data = await response.json()
        console.log("Fetched test data from data.json")

        const table = document.createElement('table')
        table.setAttribute('id', 'testDataTable')
        
        const tableHeader = document.createElement('thead')
        fieldNames.forEach(field => {
            const th = document.createElement('th')
            th.textContent = field
            tableHeader.appendChild(th)
        })

        const tableBody = document.createElement('tbody')
        data.forEach(resident => {
            const row = document.createElement('tr')
            const fullName = `${resident.LastName}, ${resident.FirstName} ${resident.MiddleName}`
            const entry = [resident.id, fullName, resident.BirthDate, resident.Gender, resident.CivilStatus]

            entry.forEach(cell => {
                const td = document.createElement('td')
                td.textContent = cell
                row.appendChild(td)
            })

            tableBody.appendChild(row)
        })

        table.append(tableHeader, tableBody)
        testDataContainer.appendChild(table)
    }
    catch (error) {
        console.error("Cannot fetch test data.", error)
        testDataContainer.innerHTML = "<p>Error loading test data.</p>"
    }
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
        document.body.innerHTML = `<p>Error loading ${file} page.</p>`
    }
}