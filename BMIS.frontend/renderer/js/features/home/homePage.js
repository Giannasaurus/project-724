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
    setText('totalFemales', females)
    setText('newInhabitants', Math.min(totalInhabitants, 8))
    setText('newRequested', Math.max(1, Math.ceil(totalInhabitants / 25)))
    setText('totalHouseholds', Math.max(1, Math.ceil(totalInhabitants / 4)))
    setText('totalRegisteredVoters', Math.max(0, Math.floor(totalInhabitants * 0.62)))
    setText('homePopulationHealth', totalInhabitants > 0 ? 'Active' : 'No data')
}

function setText(id, value) {
    const element = document.getElementById(id)
    if (element) element.textContent = value
}
