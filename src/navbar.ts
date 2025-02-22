

let navhtml = `
<nav class="sidebar">
  <ul>
    <li><a href="${import.meta.env.BASE_URL}index.html">Home</a></li>
    <li><a href="${import.meta.env.BASE_URL}latency/index.html">Latency</a></li>
    <li><a href="${import.meta.env.BASE_URL}stations/index.html">Stations</a></li>
    <li><a href="${import.meta.env.BASE_URL}heli/index.html">Helicorders</a></li>
    <li><a href="${import.meta.env.BASE_URL}scearthquakes/index.html">SC Earthquakes</a></li>
    <li><a href="${import.meta.env.BASE_URL}cellstat/index.html">Cell Stat</a></li>
    <li><a href="${import.meta.env.BASE_URL}batterystat/index.html">Battery Stat</a></li>
    <li><a href="${import.meta.env.BASE_URL}voltage/index.html">Voltage</a></li>
    <li><a href="${import.meta.env.BASE_URL}about/index.html">About</a></li>
    <li><a href="${import.meta.env.BASE_URL}contact/index.html">Contact</a></li>
  </ul>
</nav>
`;

export function createNavigation() {
  const navDiv = document.querySelector<HTMLDivElement>('#nav')!
  if (navDiv) {
    navDiv.innerHTML = navhtml;
  }
}
