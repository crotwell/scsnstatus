import './style.css'
import * as sp from 'seisplotjs';

const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `
  <h1>Hello Vite!</h1>
  <p>spjs version: ${sp.version}</p>
  <a href="https://vitejs.dev/guide/features.html" target="_blank">Documentation</a>
`
}
