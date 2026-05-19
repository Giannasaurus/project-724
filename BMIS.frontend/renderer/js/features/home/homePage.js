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
    setText('totalPwdSecondary', pwdResidents)
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
    setBarWidth('maleChartBar', getPercentage(males, totalInhabitants))
    setBarWidth('femaleChartBar', getPercentage(females, totalInhabitants))
    setBarWidth('pwdChartBar', getPercentage(pwdResidents, totalInhabitants))
    renderSeniorBracket('senior60To70', 'senior60To70Bar', seniorBrackets.sixties, seniors)
    renderSeniorBracket('senior70To80', 'senior70To80Bar', seniorBrackets.seventies, seniors)
    renderSeniorBracket('senior80To90', 'senior80To90Bar', seniorBrackets.eighties, seniors)
    renderSeniorBracket('senior90To100', 'senior90To100Bar', seniorBrackets.nineties, seniors)
}

function setText(id, value) {
    const element = document.getElementById(id)
    if (element) element.textContent = value
}

function setBarWidth(id, value) {
    const element = document.getElementById(id)
    if (!element) return

    element.style.display = value > 0 ? 'block' : 'none'
    element.style.width = `${value}%`
}

function getPercentage(value, total) {
    if (total <= 0) return 0
    return Math.max(4, Math.round((value / total) * 100))
}

function renderSeniorBracket(textId, barId, value, total) {
    setText(textId, value)
    setBarWidth(barId, getPercentage(value, total))
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
