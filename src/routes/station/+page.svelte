<svelte:head>
	<title>Station List</title>
</svelte:head>

<script lang="ts">
	import type { PageData } from './$types';
  import { onMount } from 'svelte';

  export let data: PageData;
  export let networks = [];

  onMount(async () => {
    // leaflet uses window, and fails to load for server-side rendering
    const  sp  = await import('seisplotjs');
    const xml = new DOMParser().parseFromString(data.rawstationxml, sp.util.XML_MIME);
    networks = sp.stationxml.parseStationXml(xml);
    document.querySelector("sp-station-table").stationList = networks[0].stations;
    if (networks.length > 0 && networks[0].stations.length > 0) {
      const p = document.querySelector("p");
      if (p.parentNode) {
        p.parentNode.removeChild(p);
      }
    }
  });


</script>


<h1>Stations: {networks.length}</h1>

<div class="stations">
  <p>No stations yet</p>
  <sp-station-table></sp-station-table>
</div>
