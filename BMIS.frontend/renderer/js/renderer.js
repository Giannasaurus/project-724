import { closeOpenRowActions, loadInitialView } from './appShell.js'

const app = document.getElementById('app')

loadInitialView(app)

document.addEventListener('click', closeOpenRowActions)
document.addEventListener('dragstart', (event) => event.preventDefault())
