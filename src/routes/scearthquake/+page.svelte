<svelte:head>
	<title>SC Earthquakes</title>
</svelte:head>

<script lang="ts">
  import { browser, building, dev, version } from '$app/environment';
  import { onMount } from 'svelte';
	import type { PageData } from './$types';
  import { invalidate } from '$app/navigation';
  import {DateTime, Interval, Duration} from 'luxon';


	export let data: PageData;

  export const SELECTED_ROW = "selectedRow";

  let quaketable;
  let quakemap;
  let timerangeEl;
  let loadYearBtn;

  onMount(async () => {

    const sp = await import('seisplotjs');

    type PageState = {
      quakeList: Array<sp.quakeml.Quake>,
      channelList: Array<sp.stationxml.Channel>,
      dataset: sp.dataset.Dataset,
    };

    let allQuakes = [];

    let pageState: PageState = {
    quakeList: [],
    channelList: [],
    dataset: new sp.dataset.Dataset(),
    }

    timerangeEl.updateCallback = (timeRange) => {
      console.log( `Range: ${timeRange.start.toISO()} to ${timeRange.end.toISO()}`);
      displayForTime(timeRange, allQuakes);
    }
    function displayForTime(timeRange: Interval, quakes: Array<Quake>): Array<Quake> {
    const quakesInTime = allQuakes.filter(q => {
      return timeRange.start <= q.time && q.time <= timeRange.end;
    });
    quaketable.quakeList = quakesInTime;
    quakemap.quakeList = []
    quakemap.addQuake(quakesInTime);
    quakemap.draw();
    }

    console.log(`qml len: ${data.qml?.length}`)
    pageState.quakeList = data.qml?.eventList;
    pageState.dataset.inventory = data.staxml;
    pageState.channelList = Array.from(sp.stationxml.allChannels(data.staxml));

    allQuakes = data.qml.eventList;
    displayForTime(timerangeEl.getTimeRange(), allQuakes);
    console.log(`got ${data.qml.eventList.length} quakes ${quaketable.quakeList.length}`)

    });

    function displayAllQuakes() {

    }

    function displayQuake(quake: sp.quakeml.Quake, pageState: PageState) {
    if ( quake == null) {
      displayAllQuakes();
    }
    document.querySelectorAll(".showquake").forEach( el => {
      el.classList.remove("hide");
      el.classList.add("show");
    });
    document.querySelectorAll(".showalleq").forEach( el => {
      el.classList.remove("show");
      el.classList.add("hide");
    });
    pageState.dataset.catalog = [ quake];
    let loader = new sp.seismogramloader.SeismogramLoader(
      pageState.dataset.inventory,
      pageState.dataset.catalog);
    loader.dataselectQuery = new sp.fdsndataselect.DataSelectQuery("eeyore.seis.sc.edu");
    //loader.dataselectQuery.port(8080)
    loader.endOffset = Duration.fromObject({minutes: 5});
    loader.load().then( ds => {
      console.log(`loader ${ds.waveforms.length} seismograms`);
      pageState.dataset = ds;
      ds.waveforms.forEach(sdd => {

        sdd.quakeList.forEach( quake => {
          const pickMarkers = sp.seismograph.createMarkerForPicks(
            quake.preferredOrigin, sdd.channel);
          sdd.addMarkers(pickMarkers);
          sdd.alignmentTime = quake.time;
        });
      });

      ds.processedWaveforms = ds.waveforms.map(sdd => {
        if (sdd.seismogram == null) {
          return sdd;
        }
        let out = sdd;
        //out = sdd.cloneWithNewSeismogram(sp.filter.rMean(sdd.seismogram));
        //out = sdd.cloneWithNewSeismogram(sp.filter.removeTrend(sdd.seismogram));
        //const highPass = sp.filter.createButterworth(2, sp.filter.BAND_PASS, 1.0, 20.0, sdd.seismogram.samplePeriod);
        //out = sdd.cloneWithNewSeismogram(sp.filter.applyFilter(highPass, out.seismogram));
        return out;
      });

      let orgDisp = document.querySelector("sp-organized-display");
      orgDisp.seismographConfig.doGain = true;
      orgDisp.seismographConfig.ySublabelIsUnits = true;
      orgDisp.seisData = ds.processedWaveforms;
    });


    quaketable.addStyle(`
        td {
          padding-left: 5px;
          padding-right: 5px;
        }
        table tbody tr.${SELECTED_ROW} td {
          background-color: green;
          color: white;
        }
      `);
    quaketable.addEventListener("quakeclick", ce => {
    console.log(`quakeclick: ${ce.detail.quake}`);
    displayQuake(ce.detail.quake, pageState);
    });
    }

</script>


<style>
  div.plot {
    width: 95%;
    min-height: 400px;
  }
  sp-station-quake-map {
    height: 400px;
  }
  .hide {
    display: none;
  }
  .show {
    display: block;
  }
</style>


<h5 id="nowtime">Now! And again!</h5>
<div>
  <sp-timerange
    bind:this={timerangeEl}
    duration="P30DT0M"></sp-timerange>
  <button id="loadMonth" on:click={() => timerangeEl.duration = 'P31D'}>Month</button>
  <button id="loadYear" bind:this={loadYearBtn} on:click={() => timerangeEl.duration = 'P1Y'} >Year</button>
  <button id="loadAll" on:click={() => {timerangeEl.end = DateTime.utc(); timerangeEl.start = DateTime.fromISO('2009-07-10T00:00:00Z');}}>All</button>
</div>
<div class="showalleq show">
  <h3>Earthquakes:</h3>
  <sp-station-quake-map
    bind:this={quakemap}
    tileUrl="http://www.seis.sc.edu/tilecache/NatGeo/&#123;z&#125;/&#123;y&#125;/&#123;x&#125;"
    tileAttribution='Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
    zoomLevel="7"
    centerLat="33.5" centerLon="-81"
    fitbounds="false">
  </sp-station-quake-map>
  <sp-quake-table
    bind:this={quaketable}>
  </sp-quake-table>
</div>
<div class="showquake hide">
  <sp-organized-display></sp-organized-display>
</div>
<div class="datakeys"></div>
<div><pre class="raw"></pre></div>
