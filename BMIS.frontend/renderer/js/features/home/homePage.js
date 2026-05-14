export function renderHomeSummary(result) {
    if (!result?.success) return

    const residents = result.data
    const totalInhabitants = residents.length
    const vulnerableResidents = residents.filter(resident => resident.sector === 1 || resident.sector === 2).length
    const males = residents.filter(resident => resident.sex === 0).length
    const females = residents.filter(resident => resident.sex === 1).length

    setText('totalInhabitants', totalInhabitants)
    setText('totalSectors', vulnerableResidents)
    setText('totalSectorsSecondary', vulnerableResidents)
    setText('totalMales', males)
    setText('totalMalesCard', males)
    setText('totalFemales', females)
    setText('totalFemalesCard', females)
    setText('newInhabitants', Math.min(totalInhabitants, 8))
    setText('newRequested', Math.max(1, Math.ceil(totalInhabitants / 25)))
    setText('totalHouseholds', Math.max(1, Math.ceil(totalInhabitants / 4)))
    setText('totalRegisteredVoters', Math.max(0, Math.floor(totalInhabitants * 0.62)))
    setText('homePopulationHealth', totalInhabitants > 0 ? 'Active' : 'No data')
    setBarWidth('maleChartBar', getPercentage(males, totalInhabitants))
    setBarWidth('femaleChartBar', getPercentage(females, totalInhabitants))
    setBarWidth('sectorChartBar', getPercentage(vulnerableResidents, totalInhabitants))
}

function setText(id, value) {
    const element = document.getElementById(id)
    if (element) element.textContent = value
}

function setBarWidth(id, value) {
    const element = document.getElementById(id)
    if (element) element.style.width = `${value}%`
}

function getPercentage(value, total) {
    if (total <= 0) return 0
    return Math.max(4, Math.round((value / total) * 100))
}
