export function renderHomeSummary(result) {
    if (!result?.success) return

    const residents = result.data
    const totalInhabitants = residents.length
    const pwdResidents = residents.filter(resident => resident.sector === 1).length
    const seniorResidents = residents.filter(resident => resident.sector === 2)
    const seniors = seniorResidents.length
    const seniorBrackets = getSeniorAgeBrackets(seniorResidents)
    const males = residents.filter(resident => resident.sex === 0).length
    const females = residents.filter(resident => resident.sex === 1).length

    setText('totalInhabitants', totalInhabitants)
    setText('totalPwd', pwdResidents)
    setText('totalSeniors', seniors)
    setText('seniorPopulationTotal', `${seniors} ${seniors === 1 ? 'senior' : 'seniors'}`)
    setText('totalMales', males)
    setText('totalMalesCard', males)
    setText('totalFemales', females)
    setText('totalFemalesCard', females)
    setText('newInhabitants', Math.min(totalInhabitants, 8))
    setText('newRequested', Math.max(1, Math.ceil(totalInhabitants / 25)))
    setText('totalHouseholds', Math.max(1, Math.ceil(totalInhabitants / 4)))
    setText('homePopulationHealth', totalInhabitants > 0 ? 'Active' : 'No data')

    setText('senior60To70', seniorBrackets.sixties)
    setText('senior70To80', seniorBrackets.seventies)
    setText('senior80To90', seniorBrackets.eighties)
    setText('senior90To100', seniorBrackets.nineties)

    // Render pie charts
    renderGenderPieChart(males, females)
    renderSeniorAgePieChart(seniorBrackets)
}

function setText(id, value) {
    const element = document.getElementById(id)
    if (element) element.textContent = value
}

function renderGenderPieChart(males, females) {
    const ctx = document.getElementById('genderPieChart')
    if (!ctx) return

    // Destroy existing chart if it exists
    if (window.genderChart) {
        window.genderChart.destroy()
    }

    const total = males + females
    if (total === 0) return

    window.genderChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Males', 'Females'],
            datasets: [{
                data: [males, females],
                backgroundColor: ['#2563EB', '#10b981'],
                borderColor: ['#1e40af', '#059669'],
                borderWidth: 3,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || ''
                            const value = context.parsed || 0
                            const percentage = Math.round((value / total) * 100)
                            return `${label}: ${value} (${percentage}%)`
                        }
                    },
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    padding: 12
                }
            }
        }
    })
}

function renderSeniorAgePieChart(seniorBrackets) {
    const ctx = document.getElementById('seniorAgePieChart')
    if (!ctx) return

    // Destroy existing chart if it exists
    if (window.seniorChart) {
        window.seniorChart.destroy()
    }

    const total = seniorBrackets.sixties + seniorBrackets.seventies + seniorBrackets.eighties + seniorBrackets.nineties
    if (total === 0) return

    window.seniorChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['60-70', '70-80', '80-90', '90+'],
            datasets: [{
                data: [seniorBrackets.sixties, seniorBrackets.seventies, seniorBrackets.eighties, seniorBrackets.nineties],
                backgroundColor: ['#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'],
                borderColor: ['#1e40af', '#6d28d9', '#d97706', '#dc2626'],
                borderWidth: 3,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || ''
                            const value = context.parsed || 0
                            const percentage = Math.round((value / total) * 100)
                            return `${label}: ${value} (${percentage}%)`
                        }
                    },
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 },
                    padding: 12
                }
            }
        }
    })
}

function getPercentage(value, total) {
    if (total <= 0) return 0
    return Math.max(4, Math.round((value / total) * 100))
}

function getSeniorAgeBrackets(seniors) {
    return seniors.reduce((brackets, resident) => {
        const age = getResidentAge(resident)

        if (age >= 60 && age < 70) brackets.sixties++
        else if (age >= 70 && age < 80) brackets.seventies++
        else if (age >= 80 && age < 90) brackets.eighties++
        else if (age >= 90) brackets.nineties++

        return brackets
    }, {
        sixties: 0,
        seventies: 0,
        eighties: 0,
        nineties: 0
    })
}

function getResidentAge(resident) {
    if (Number.isFinite(resident.age)) return resident.age

    const birthdate = new Date(resident.birthDate)
    if (Number.isNaN(birthdate.getTime())) return 0

    const today = new Date()
    let age = today.getFullYear() - birthdate.getFullYear()
    const hasBirthdayPassed = today.getMonth() > birthdate.getMonth()
        || (today.getMonth() === birthdate.getMonth() && today.getDate() >= birthdate.getDate())

    return hasBirthdayPassed ? age : age - 1
}
