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
        console.log("Fetched login.html.")
    }
    catch (error) {
        console.error("Cannot fetch home.html.", error)
        app.innerHTML = "<p>Error loading content.</p>"
        return
    }
}