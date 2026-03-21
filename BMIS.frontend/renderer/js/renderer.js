const un = window.env.username
const pw = window.env.password

const app = document.getElementById('app')

loadLogin("login.html")

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

    const username = document.getElementById('usernameInput')
    const password = document.getElementById('passwordInput')
    const loginForm = document.getElementById('loginForm')

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const loginErrorMessage = document.getElementById('loginErrorMessage')

        if (username.value === un && password.value === pw) {
            loadHome("home.html")
        } else {
            loginErrorMessage.textContent = "Incorrect username/password"
        }

        console.log({
            enteredUsername: username.value,
            enteredPassword: password.value,
            expectedUsername: un,
            expectedPassword: pw,
            usernameMatch: username.value === un,
            passwordMatch: password.value === pw
        })
    })
}

async function loadHome(file) {
    try {
        const response = await fetch(file)
        console.log(response)
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
}

async function loadTestData(datafile) {
    const fieldNames = ["Index", "Inhabitant Name", "Birthdate", "Gender", "Civil Status", "PWD/Senior"]
    const testDataContainer = document.getElementById('testDataContainer')
    let data
    
    try {
        const response = await fetch(datafile)
        console.log(response)
        if (!response.ok) throw new Error(response.status)
        data = await response.json()
        console.log(data)
        console.log("Fetched test data from data.json")
        
        const table = document.createElement('table')
        table.setAttribute('id', 'testDataTable')
        const tableHeader = document.createElement('thead')
        
        for (let i = 0; i < fieldNames.length; i++) {
            const header = document.createElement('th')
            header.textContent = fieldNames[i]
            tableHeader.appendChild(header)
        }
        
        table.appendChild(tableHeader)
        testDataContainer.appendChild(table)
    }
    catch (error) {
        console.error("Cannot fetch test data.", error)
        testDataContainer.innerHTML = "<p>Error loading test data.</p>"
        return
    }
}