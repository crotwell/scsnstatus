import './style.css'
import * as sp from 'seisplotjs';
import {createNavigation} from './navbar';

createNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `
  <h1>South Carolina Seismic Network Status</h1>
  <p>spjs version: ${sp.version}</p>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`
}
