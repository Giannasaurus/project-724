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