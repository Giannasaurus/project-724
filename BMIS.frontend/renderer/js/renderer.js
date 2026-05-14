import { closeOpenRowActions, loadApp } from './appShell.js'

const app = document.getElementById('app')

loadApp(app)

document.addEventListener('click', closeOpenRowActions)
