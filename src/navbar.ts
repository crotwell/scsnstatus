

let navhtml = `
<nav class="sidebar">
  <ul>
    <li><a href="${import.meta.env.BASE_URL}index.html">Home</a></li>
    <li><a href="${import.meta.env.BASE_URL}stations/index.html">Stations</a></li>
    <li><a href="${import.meta.env.BASE_URL}cellstat/index.html">Cell Stat</a></li>
    <li><a href="${import.meta.env.BASE_URL}batterystat/index.html">Battery Stat</a></li>
    <li><a href="#">About</a></li>
    <li><a href="#">Contact</a></li>
  </ul>
</nav>
`;

export function createNavigation() {
  const navDiv = document.querySelector<HTMLDivElement>('#nav')!
  if (navDiv) {
    navDiv.innerHTML = navhtml;
  }
}
