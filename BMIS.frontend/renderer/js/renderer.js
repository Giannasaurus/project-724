const app = document.getElementById('app')

// skip login (dev)
if (localStorage.getItem("username")) loadHome("home.html")
else loadLogin("login.html")

async function loadLogin(file) {
    try {
        const response = await fetch(file)
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
        const data = await response.text()
        app.innerHTML = data
        console.log("Fetched login.html.")
    }
    catch (error) {
        console.error("Cannot fetch login.html.", error)
        document.body.innerHTML = "<p>Error loading login page.</p>"
        return
    }

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
            loadHome("home.html")
        }
        else {
            return loginErrorMessage.textContent = "Incorrect username/password"
        }
    })
}

async function loadHome(file) {
    try {
        const response = await fetch(file)
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`)
        const text = await response.text()
        app.innerHTML = text
        console.log("Fetched home.html.")
    }
    catch (error) {
        console.error("Cannot fetch home.html.", error)
        app.innerHTML = "<p>Error loading content.</p>"
        return
    }

    loadTestData("testData/data.json")
    loadTestData("")
}

async function loadTestData(datafile) {
    const fieldNames = ["Index", "Inhabitant Name", "Birthdate", "Sex", "Civil Status", "PWD/Senior"]
    const testDataContainer = document.getElementById('testDataContainer')
    let data

    try {
        const response = await fetch(datafile)
        if (!response.ok) throw new Error(response.status)
        data = await response.json()
        console.log("Fetched test data from data.json")

        const table = document.createElement('table')
        table.setAttribute('id', 'testDataTable')
        const tableHeader = document.createElement('thead')

        fieldNames.forEach(field => {
            const header = document.createElement('th')
            header.textContent = field
            tableHeader.appendChild(header)
        })

        const tableBody = document.createElement('tbody')

        data.forEach(resident => {
            const tableRow = document.createElement('tr')

            const inhabitantFullName = `${resident.LastName}, ${resident.FirstName} ${resident.MiddleName}`

            const entry = [resident.id, inhabitantFullName, resident.BirthDate, resident.Gender, resident.CivilStatus]

            entry.forEach(cell => {
                const tableData = document.createElement('td')
                tableData.textContent = cell
                tableRow.appendChild(tableData)
            })

            tableBody.appendChild(tableRow)
        })

        table.append(tableHeader, tableBody)
        testDataContainer.appendChild(table)
    }
    catch (error) {
        console.error("Cannot fetch test data.", error)
        testDataContainer.innerHTML = "<p>Error loading test data.</p>"
        return
    }
}