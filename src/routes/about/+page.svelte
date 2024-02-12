<svelte:head>
	<title>About</title>
</svelte:head>

<script lang="ts">

import { onMount } from 'svelte';

export let data: PageData;

let version;

import { Duration, Interval, DateTime } from 'luxon';

  onMount(async () => {
    // leaflet uses window, and fails to load for server-side rendering
    const  sp  = await import('seisplotjs');
    version.textContent = sp.version;
  });
</script>

<h1>About SCSN Status</h1>

<p>Hi there</p>

<h3>SP version <span bind:this={version}>???</span></h3>
