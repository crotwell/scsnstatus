import './style.css'
import {createNavigation} from './navbar';

createNavigation();
const app = document.querySelector<HTMLDivElement>('#app')!

if (true) {
app.innerHTML = `
<h1>About</h1>

<h3>South Carolina Seismic Network</h3>

<p>
The SCSN was founded in 1974 by Pradeep Talwani at USC and collaborators at the
US Geological Survey. The 1886 Charleston Earthquake demonstrated that
substantial earthquake hazards exist in the region. The SCSN operates a
small network of seismographs throughout the state to monitor continuing
seismicity in the region.
</p>
<p>
Dr. Talwani retired in 2009 and the SCSN was under the direction of
Dr. Tom Owens until his retirement in 2022. Dr. Scott White was director from
2022-2024. Dr. Dan Frost is the current
director. Dr. Philip Crotwell is the network manager.
</p>

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
