import './style.css'
import {createNavigation} from './navbar';

createNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `
<h1>Contact</h1>

<h3>South Carolina Seismic Network</h3>

<pre>
School of Earth, Ocean and Environment
University of South Carolina
701 Sumter St.
Columbia SC 20208
</pre>
<a href="mailto:scsn@seis.sc.edu"> scsn@seis.sc.edu </a>
<pre>
(803)777-4535
</pre>

`
}
