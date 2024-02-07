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

.latency-conn-ok {
  color: green;
}
.latency-conn-error {
  color: magenta;
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
    latencyConnFailure,
    latencyConnFailureNumber,
  } from '$lib/latency-util'
  import {Interval, DateTime} from 'luxon';

	export let data: PageData;
  let accessTimer;
  let nowtimeutc;
  let nowtimelocal;

	onMount(() => {
    console.log("in onMount");
    const interval = setInterval( () => {
      console.log("timeout inside onMount, invalidating")
          invalidate("data:latency");
        }, 10000);
    const infoTimersInterval = setInterval( () => {
      let accessDur = Interval.fromDateTimes(data.latency.accessTime, DateTime.utc()).toDuration();
      accessDur = accessDur.normalize();
      accessTimer.textContent = `${accessDur.toFormat('hh:mm:ss')} ago`;
      nowtimeutc.textContent = DateTime.utc().set({milliseconds: 0}).toISO();
      nowtimelocal.textContent = DateTime.now().set({milliseconds: 0}).toISO();
    }, 1000);

    return () => {
			clearInterval(interval);
      clearInterval(infoTimersInterval);
		};
  });
</script>

<h5>Access: {data.latency.accessTime.toISO()}  {data.latency.latestData.length}</h5>

<div class="latency">
  <table>
    <tr>
      <th></th>
      <th class={latencyConnFailure(data.statsFailures, "cloud")}>
        Cloud {latencyConnFailureNumber(data.statsFailures, "cloud")}
      </th>
      <th></th>
      <th></th>
      <th></th>

      <th class={latencyConnFailure(data.statsFailures, "eeyore")}>Eeyore</th>
      <th></th>
      <th></th>
      <th></th>

      <th class={latencyConnFailure(data.statsFailures, "iris")}>IRIS</th>
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
      <td class={latencySeriousness(ld.eeyore.end)}>{ld.eeyore.end.toISOTime()}</td><td>{latencyAsText(ld.eeyore.end)}</td><td>{ld.velocity.eeyore.toFixed(2)}</td><td>{latencyVelocityIcon(ld.velocity.eeyore)}</td>
      <td class={latencySeriousness(ld.iris.end)}>{ld.iris.end.toISOTime()}</td><td>{latencyAsText(ld.iris.end)}</td><td>{ld.velocity.iris.toFixed(2)}</td><td>{latencyVelocityIcon(ld.velocity.iris)}</td>
    </tr>
    {/each}
  </table>
  <h5>Access at
    {data.latency.accessTime.toISO()} UTC,
   <span bind:this={accessTimer}></span></h5>
  <h5>Rate averaged over last {data?.previousLatencyCache?.accessTime.toISO()}
    {#if data?.previousLatencyCache?.accessTime != null}
    {Math.round(Interval.fromDateTimes(data.previousLatencyCache.accessTime, data.latency.accessTime).toDuration().toMillis()/1000)}
    {:else}
    -
    {/if} seconds.
  </h5>
  <h5>Update Interval: {data.latency.updateIntervalSeconds} seconds</h5>
  <h5>UTC: <span bind:this={nowtimeutc}>{DateTime.utc().toISO()}</span></h5>
  <h5>Local: <span bind:this={nowtimelocal}>{DateTime.now().toISO()}</span></h5>


</div>
<div class="datakeys"></div>
<div><pre class="raw"></pre></div>
