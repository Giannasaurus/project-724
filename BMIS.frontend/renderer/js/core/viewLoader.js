export async function loadView(file, container) {
    try {
        const response = await fetch(file)
        if (!response.ok) throw new Error(response.status)

        container.innerHTML = await response.text()
    }
    catch (error) {
        console.error(`Cannot fetch ${file}`, error)
        container.innerHTML = `<p>Error loading ${file} page.</p>`
    }
}
