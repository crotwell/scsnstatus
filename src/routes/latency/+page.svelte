
<script lang="ts">
  import { onMount } from 'svelte';

  onMount(async () => {
    const  sp  = await import('seisplotjs');
    const datalatency = await import("$lib/data-latency.ts");

    const latencyServ = new datalatency.DataLatencyService();

    function updateLatency() {
      latencyServ.queryLatency().then(ldata => {
        const div = document.querySelector("div.stations");
        while (div.lastChild) {
          div.removeChild(div.lastChild);
        }
        div.appendChild(document.createElement("p")).textContent = `Got Latency: ${ldata.accessTime}`;
        ldata.latestData.forEach(ld => {
          div.appendChild(document.createElement("p")).textContent = `${ld.velocity.cloud} ${ld.velocity.iris} ${ld.velocity.eeyore}`;
        });

      });

      if (latencyServ.previousLatencyCache === null) {
        setTimeout( () => {
          updateLatency();
        }, 2000);
      } else {
        setTimeout( () => {
          updateLatency();
        }, latencyServ.updateInterval.toMillis());
      }
    }
    updateLatency();
  });
</script>

<h5 id="nowtime">Now!</h5>
<div>
  <sp-timerange duration="P2DT0M"></sp-timerange>
  <button id="loadToday">Today</button>
  <button id="loadNow">Now</button>
</div>
<div class="plot"></div>
<div class="stations"></div>
<div class="datakeys"></div>
<div><pre class="raw"></pre></div>
