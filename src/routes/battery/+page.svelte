<script lang="ts">
	import { onMount } from 'svelte';

	export let data: PageData;

	import { Duration, Interval, DateTime } from 'luxon';

	onMount(async () => {
		// leaflet uses window, and fails to load for server-side rendering
		const sp = await import('seisplotjs');
		const statpage = await import('$lib/statpage.ts');
		const jsonl_loader = await import('$lib/jsonl_loader.ts');

		let curKey = 'soc';
		const lineColors = new sp.seismographconfig.SeismographConfig().lineColors;
		const allStations = ['BIRD', 'JSC', 'CASEE', 'CSB', 'HAW', 'HODGE', 'PAULI', 'TEEBA'];
		let colorForStation = statpage.createColors(allStations);

		let selectedStations = allStations.slice();

		function dataFn(d: jsonl_loader.KilovaultSOC): number {
			if (curKey === 'soc') {
				const firstObj = d.soc[0];
				if (firstObj && 'percentCharge' in firstObj && firstObj.percentCharge) {
					return firstObj.percentCharge;
				} else {
					return 0;
				}
			} else {
				return 0;
			}
		}

		function textDataFn(d: jsonl_loader.KilovaultSOC): string {
			if (curKey === 'soc') {
				const firstObj = d.soc[0];
				if (firstObj && 'percentCharge' in firstObj) {
					if (firstObj.percentCharge) {
						return `${firstObj.id} ${firstObj.percentCharge}`;
					} else {
						return `undef`;
					}
				} else {
					return 'missing';
				}
			} else {
				return '';
			}
		}

		function createKeyCheckbox(stat: jsonl_loader.KilovaultSOC) {
			const selector = 'div.datakeys';
			let statKeys = [];
			for (const key in stat) {
				if (key === 'time' || key === 'station') {
					continue;
				}
				statKeys.push(key);
			}
			statpage.createKeyCheckboxes(selector, statKeys, curKey, (key) => {
				curKey = key;
				doPlot('div.plot', data.batterystats, dataFn, selectedStations, colorForStation);
			});
		}

		function handleData(allStats: Array<jsonl_loader.KilovaultSOC>) {
			if (allStats.length > 0) {
				createKeyCheckbox(allStats[0]);
			}
			allStats.sort(statpage.timesort);
			let expandData: Array<jsonl_loader.KilovaultSOC> = [];
			if (curKey === 'soc') {
				allStats.forEach((stat) => {
					if (stat.soc.length > 1) {
						stat.soc.forEach((s) => {
							const d = structuredClone(stat);
							d.soc = [s]; // clone but with only one soc
							d.time = stat.time;
							expandData.push(d);
						});
					} else {
						expandData.push(stat);
					}
				});
				expandData = expandData.filter(
					(stat) =>
						stat.soc[0] &&
						'percentCharge' in stat.soc[0] &&
						stat.soc[0].percentCharge >= 0 &&
						stat.soc[0].percentCharge <= 100
				);
			} else {
				expandData = allStats;
			}

			if (true) {
				// output raw values as text, for debugging
				statpage.doText(
					'pre.raw',
					expandData,
					textDataFn,
					selectedStations
					//  lineColors
				);
			}
			statpage.doPlot('div.plot', expandData, dataFn, selectedStations, colorForStation);
			return allStats;
		}

		const stationCallback = function (sta: string, checked: boolean) {
			if (checked) {
				selectedStations.push(sta);
			} else {
				selectedStations = selectedStations.filter((s) => s !== sta);
			}
			statpage.doPlot('div.plot', data.batterystats, dataFn, selectedStations, colorForStation);
		};

		statpage.createStationCheckboxes(allStations, stationCallback, colorForStation);

		const timeChooser = statpage.initTimeChooser(Duration.fromISO('P2DT120M'), (timerange) => {
			console.log('time change...');
			//data.batterystats = await jsonl_loader.loadKilovaultStats(selectedStations, timerange).then(handleData);
		});

		handleData(data.batterystats);
	});
</script>

<svelte:head>
	<title>Battery Status</title>
</svelte:head>

<div>
	<sp-timerange duration="P2DT0M"></sp-timerange>
	<button id="loadToday">Today</button>
	<button id="loadNow">Now</button>
</div>
<div class="plot"></div>
<div class="stations"></div>
<div class="datakeys"></div>
<div><pre class="raw"></pre></div>

<style>
	div.plot {
		width: 95%;
		min-height: 400px;
	}
</style>
