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

export function attachInhabitantListeners({ handleCloseOnBackdrop, addResidentHistoryLog, loadData }) {
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

        const result = await postData('/residents', payload)

        saveBtn.disabled = false
        saveBtn.textContent = 'Save'

        if (result.success) {
            addResidentHistoryLog(result.data)
            addResidentDialog.close()
            const freshData = await getData('/residents')
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
