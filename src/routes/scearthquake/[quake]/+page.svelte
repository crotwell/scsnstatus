<svelte:head>
	<title>Seismograms</title>
</svelte:head>

<script lang="ts">
  import { onMount } from 'svelte';
  import {DateTime, Interval, Duration} from 'luxon';
  import type { PageData } from './$types';

  export let data: PageData;

  let orgdisplay;

  onMount(async () => {
    const  sp  = await import('seisplotjs');

    let dataset = new sp.dataset.Dataset();
    dataset.catalog = [ data.quake];
    dataset.inventory = data.inventory;
    let loader = new sp.seismogramloader.SeismogramLoader(
      dataset.inventory,
      dataset.catalog);
    loader.dataselectQuery = new sp.fdsndataselect.DataSelectQuery("eeyore.seis.sc.edu");
    //loader.dataselectQuery.port(8080)
    loader.endOffset = Duration.fromObject({minutes: 5});
    loader.load().then( ds => {
      console.log(`loader ${ds.waveforms.length} seismograms`);
      dataset = ds;
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


      orgdisplay.seismographConfig.doGain = true;
      orgdisplay.seismographConfig.ySublabelIsUnits = true;
      orgdisplay.seisData = ds.processedWaveforms;
    });

  });
</script>



<h1>{data.title}</h1>
<h3>{data.quakeml_id} spjs: {data.spjsversion}</h3>
<h3>{data.quake.eventId}</h3>

<div>{@html data.content}</div>
<sp-organized-display
  bind:this={orgdisplay}
  tileUrl="http://www.seis.sc.edu/tilecache/NatGeo/&#123;z&#125;/&#123;y&#125;/&#123;x&#125;/"
  tileAttribution='Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
  sort="distance"
>
</sp-organized-display>
