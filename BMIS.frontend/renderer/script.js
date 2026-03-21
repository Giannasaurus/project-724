const un = window.env.username
const pw = window.env.password

const app = document.getElementById('app')

loadLogin("login.html")

async function loadLogin(file) {
    try {
        const response = await fetch(file)
        if (!response.ok) {
            throw new Error(`HTTP error! Response: ${response.status}`)
        }
        const data = await response.text()
        app.innerHTML = data
    }
    catch (error) {
        console.error("Cannot fetch file.", error)
        document.body.innerHTML = "Error loading login page."
    }

    const username = document.getElementById('usernameInput')
    const password = document.getElementById('passwordInput')
    const loginForm = document.getElementById('loginForm')
    try {
        if (!loginForm) {
            console.log("no login form detected")
            throw new Error(e)
        }
    }
    catch (e) {
        console.error(e)
    }
    const loginErrorMessage = document.getElementById('loginErrorMessage')

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault()

        if (username.value === un && password.value === pw) {
            loadHome("home.html")
        } else {
            console.log(un, pw)
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
    console.log("Called loadHome()")
    try {
        const response = await fetch(file)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }
        const text = await response.text()
        app.innerHTML = text
    }
    catch (error) {
        console.error("Cannot load HTML file: ", error)
        app.innerHTML = "<p>Error loading content.</p>"
    }
}