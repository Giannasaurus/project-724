import { getData, postData } from './api.js'

export function getPageNumbers(current, total) {
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

export function renderPagination(current, total, onPageChange) {
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

export function initInhabitantListeners({ handleCloseOnBackdrop, addResidentHistoryLog, loadData }) {
    const searchBar = document.getElementById('searchBar')
    const searchBtn = document.getElementById('btn_search')

    async function displayInhabitants() {
        const query = searchBar.value.trim()
        const endpoint = query
            ? `/residents/filter?firstName=${encodeURIComponent(query)}`
            : '/residents/filter?from=0&limit=50'
        const data = await getData(endpoint)
        await loadData(data)
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', displayInhabitants)
    }

    if (searchBar) {
        searchBar.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') displayInhabitants()
        })
    }
    const addResidentBtn = document.getElementById('addResidentBtn')
    const addResidentDialog = document.getElementById('addResidentDialog')
    const addResidentForm = document.getElementById('addResidentForm')
    addResidentBtn.addEventListener('click', () => {
        addResidentForm.reset()
        document.getElementById('ar-error').textContent = ''
        addResidentDialog.showModal()
        addResidentDialog.addEventListener('click', handleCloseOnBackdrop, { once: true })
    })

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
            addResidentDialog.close()
            const freshData = await getData('/residents/filter?from=0&limit=50')
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

function getAddResidentFormValues() {
    return {
        firstName: document.getElementById('ar-firstName').value.trim(),
        middleName: document.getElementById('ar-middleName').value.trim(),
        lastName: document.getElementById('ar-lastName').value.trim(),
        suffix: document.getElementById('ar-suffix').value.trim(),
        address: document.getElementById('ar-address').value.trim(),
        day: document.getElementById('ar-bday').value.padStart(2, '0'),
        month: String(document.getElementById('ar-bmonth').value).padStart(2, '0'),
        year: document.getElementById('ar-byear').value,
        sex: parseInt(document.getElementById('ar-sex').value),
        sector: parseInt(document.getElementById('ar-sector').value),
        civilStatus: parseInt(document.getElementById('ar-civilStatus').value),
    }
}

function getAddResidentPayload(values) {
    return {
        firstName: values.firstName,
        middleName: values.middleName,
        lastName: values.lastName,
        suffix: values.suffix,
        birthDate: `${values.year}-${values.month}-${values.day}`,
        sex: values.sex,
        sector: values.sector,
        civilStatus: values.civilStatus,
        address: values.address
    }
}
