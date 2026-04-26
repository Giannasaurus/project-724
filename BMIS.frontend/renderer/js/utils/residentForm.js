export function openAddResidentPage(options = {}) {
    const { addResidentHistoryLog, showResidentsView } = options
    const ilview = document.getElementById("iLView")
    const addResidentBtn = document.getElementById('addResidentBtn')
    if (!ilview || !addResidentBtn) return

    addResidentBtn.addEventListener('click', async () => {
        ilview.innerHTML = ""
        const response = await fetch("./views/subviews/addResident.html")

        try {
            if (!response.ok) throw new Error(response.status)
        }
        catch (err) {
            console.log(err)
        }

        const html = await response.text()
        ilview.innerHTML = html

        const addResidentForm = document.getElementById('addResidentForm')
        addResidentForm.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.matches('input')) {
                e.preventDefault()
                addResidentForm.requestSubmit()
            }
        })

        addResidentForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const errorEl = document.getElementById('ar-error')
            errorEl.textContent = ''

            const values = getAddResidentFormValues()

            if (!values.firstName || !values.middleName || !values.lastName || !values.address || !values.day || !values.year) {
                errorEl.textContent = 'Please fill in all required fields.'
                return
            }

            const payload = getAddResidentPayload(values)

            const saveBtn = document.getElementById('ar-saveBtn')
            saveBtn.disabled = true
            saveBtn.textContent = 'Saving...'

            const result = await postData('/residents', payload)

            saveBtn.disabled = false
            saveBtn.textContent = 'Save'

            if (result.success) {
                addResidentHistoryLog(result.data)
                await showResidentsView?.(1)
            } else {
                errorEl.textContent = 'Failed to save resident. Please try again.'
                console.error(result.message)
            }
        })

        const arCancelBtn = document.querySelector('.ar-cancel-btn')
        if (arCancelBtn) {
            arCancelBtn.addEventListener('click', async () => {
                await showResidentsView?.(1)
            })
        }

        const backBtn = document.querySelector('.back-btn')
        if (backBtn) {
            backBtn.addEventListener('click', async () => {
                await showResidentsView?.(1)
            })
        }
    })
}

export function openEditResidentPage(viewToReplace) {
    // render Edit Resident subview
    // pre-fill input fields with the target resident

}