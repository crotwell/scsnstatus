<svelte:head>
	<title>Station List</title>
</svelte:head>

<style>
  sp-station-quake-map {
    height: 300px;
  }
</style>

<script lang="ts">
	import type { PageData } from './$types';
  import { onMount } from 'svelte';
  import {DateTime} from 'luxon';

  export let data: PageData;
  export let networks = [];
  let stationmap;
  let stationtable;
  let inactivestationtable;

  onMount(async () => {
    // leaflet uses window, and fails to load for server-side rendering
    const  sp  = await import('seisplotjs');
    const xml = new DOMParser().parseFromString(data.rawstationxml, sp.util.XML_MIME);
    networks = sp.stationxml.parseStationXml(xml);
    if (networks.length > 0 && networks[0].stations.length > 0) {
      const p = document.querySelector("p");
      if (p.parentNode) {
        p.parentNode.removeChild(p);
      }
    }
    const now = DateTime.utc();
    const inactiveClass = `${sp.leafletutil.InactiveStationMarkerClassName}`;
    const inactiveSta = [];
    const activeSta = [];
    for(let s of sp.stationxml.allStations(networks)) {
      if (s.timeRange.isBefore(now)) {
        inactiveSta.push(s);
      } else {
        activeSta.push(s);
      }
    }
    stationtable.columnLabels.delete(sp.infotable.STATION_COLUMN.END);
    stationtable.stationList = activeSta;
    inactivestationtable.stationList = inactiveSta;
    stationmap.addStation(inactiveSta, sp.leafletutil.InactiveStationMarkerClassName);
    stationmap.addStation(activeSta);
    stationmap.draw();
  });


</script>


<h1>Stations: {networks.length}</h1>

<div class="stations">
  <p>No stations yet</p>
  <sp-station-quake-map
    bind:this={stationmap}
    tileUrl="http://www.seis.sc.edu/tilecache/NatGeo/&#123;z&#125;/&#123;y&#125;/&#123;x&#125;"
    tileAttribution='Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
  >
  </sp-station-quake-map>
  <h3>Current Stations:</h3>
  <sp-station-table
    bind:this={stationtable}
    >
  </sp-station-table>
  <h3>Inactive Stations:</h3>
  <sp-station-table
    bind:this={inactivestationtable}
    >
  </sp-station-table>
</div>
