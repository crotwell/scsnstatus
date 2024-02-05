<svelte:head>
	<title>Latency</title>
</svelte:head>

<style>
table.latencytable tr td.station {
  height: 24px;
}

.latency-conn-failure {
  color: red;
}

.latencygood {
  color: black;
}

.latencyworry {
  color:orange;
}

.latencybad {
  color:red;
}

.latencybadbad {
  background-color:red;
  color:white;
}

</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
  import { invalidate } from '$app/navigation';
  import {
    latencyAsText,
    latencyVelocityIcon,
    latencySeriousness,
  } from '$lib/latency-util'

	export let data: PageData;

	onMount(() => {
    console.log("in onMount");
    const interval = setInterval( () => {
      console.log("timeout inside onMount, invalidating")
          invalidate("data:latency");
        }, 10000);

    return () => {
			clearInterval(interval);
		};
  });
</script>

<h5 id="nowtime">Now!</h5>
<div>
  <sp-timerange duration="P2DT0M"></sp-timerange>
  <button id="loadToday">Today</button>
  <button id="loadNow">Now</button>
</div>
<div class="plot"></div>
<h5>Access: {data.latency.accessTime.toISO()}  {data.latency.latestData.length}</h5>

<div class="latency">
  <table>
    <tr>
      <th></th>
      <th>Cloud</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>

      <th>Eeyore</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th>IRIS</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
    <tr>
      <th>Station</th>

      <th>UTC</th>
      <th>Latency</th>
      <th>Rate</th>
      <th></th>
      <th>UTC</th>
      <th>Latency</th>
      <th>Rate</th>
      <th></th>
      <th>UTC</th>
      <th>Latency</th>
      <th>Rate</th>
      <th></th>
    </tr>
    {#each data.latency.latestData as ld}
    <tr>
      <td>{ld['key']}</td>
      <td class={latencySeriousness(ld.cloud.end)}>{ld.cloud.end.toISOTime()}</td><td>{latencyAsText(ld.cloud.end)}</td><td>{ld.velocity.cloud.toFixed(2)}</td><td>{latencyVelocityIcon(ld.velocity.cloud)}</td>
      <td>{ld.eeyore.end.toISOTime()}</td><td>{latencyAsText(ld.eeyore.end)}</td><td>{ld.velocity.eeyore.toFixed(2)}</td><td>{latencyVelocityIcon(ld.velocity.eeyore)}</td>
      <td>{ld.iris.end.toISOTime()}</td><td>{latencyAsText(ld.iris.end)}</td><td>{ld.velocity.iris.toFixed(2)}</td><td>{latencyVelocityIcon(ld.velocity.iris)}</td>
    </tr>
    {/each}
  </table>
</div>
<div class="datakeys"></div>
<div><pre class="raw"></pre></div>
