<script>
	import { DateTime } from 'luxon';
	let navbarclock;
	function createUpdatingClock() {
		setInterval(() => {
			let n = DateTime.utc().set({ millisecond: 0 });
			if (navbarclock != null) {
				navbarclock.textContent = `${n.toISO({ suppressMilliseconds: true })} UTC`;
			}
		}, 1000);
	}
	createUpdatingClock();
</script>

<nav class="sidebar">
	<ul>
		<li><a href="/">Home</a></li>
		<li><a href="/latency">Latency</a></li>
		<li><a href="/station">Stations</a></li>
		<li><a href="/scearthquake">SC Earthquakes</a></li>
		<li><a href="/cellular">Cell Stat</a></li>
		<li><a href="/battery">Battery Stat</a></li>
		<li><a href="/diskusage">Computer Stat</a></li>
		<li><a href="/about">About</a></li>
		<li><a href="/contact">Contact</a></li>
		<li><span bind:this={navbarclock} id="nbclock">Now!</span></li>
	</ul>
</nav>

<style>
	nav ul {
		list-style: none;
		background: lightgrey;
	}

	nav ul li {
		display: inline-block;
		padding: 0 3px;
		min-width: 5rem;
		text-align: center;
	}

	nav ul li:not(:last-child) {
		border-right: 1px solid black;
	}
</style>
