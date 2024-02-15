<script lang="ts">
	import { onMount } from 'svelte';

	export let data: PageData;

	import { Duration, Interval, DateTime } from 'luxon';

	onMount(async () => {
		// leaflet uses window, and fails to load for server-side rendering
		const sp = await import('seisplotjs');
		const statpage = await import('$lib/statpage.ts');
		const jsonl_loader = await import('$lib/jsonl_loader.ts');

		let curKey = 'du_data';
		const lineColors = new sp.seismographconfig.SeismographConfig().lineColors;
		const allStations = ['BIRD', 'JSC', 'CASEE', 'CSB', 'HAW', 'HODGE', 'PAULI', 'TEEBA'];
		let colorForStation = statpage.createColors(allStations);

		let selectedStations = allStations.slice();

		function dataFn(d: jsonl_loader.ComputerStat): number {
			if (curKey === 'temp') {
				return d.temp;
			} else if (curKey === 'du_data') {
				const firstObj = d.du.find((item) => item.path === '/data/scsn');
				if (firstObj && 'percentused' in firstObj && firstObj.percentused) {
					return firstObj.percentused;
				} else {
					return 0;
				}
			} else {
				return 0;
			}
		}

		function textDataFn(d: jsonl_loader.ComputerStat): string {
			if (curKey === 'temp') {
				return d.temp;
			} else if (curKey === 'du_data') {
				const firstObj = d.du.find((item) => item.path === '/data/scsn');
				if (firstObj && 'percentused' in firstObj) {
					if (firstObj.percentused) {
						return `${firstObj.id} ${firstObj.percentused}`;
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

		function createKeyCheckbox(stat: jsonl_loader.ComputerStat) {
			const selector = 'div.datakeys';
			let statKeys = [];
			for (const key in stat) {
				if (key === 'time' || key === 'station') {
					continue;
				}
				if (key === 'du') {
					continue;
				}
				statKeys.push(key);
			}
			statKeys.push('du_data');
			statpage.createKeyCheckboxes(selector, statKeys, curKey, (key) => {
				curKey = key;
				statpage.doPlot('div.plot', data.computerStat, dataFn, selectedStations, colorForStation);
			});
		}

		function handleData(allStats: Array<jsonl_loader.ComputerStat>) {
			if (allStats.length > 0) {
				createKeyCheckbox(allStats[0]);
			}
			allStats.sort(statpage.timesort);
			let expandData: Array<jsonl_loader.ComputerStat> = [];
			if (curKey === 'du') {
				allStats.forEach((stat) => {
					if (stat.du.length > 1) {
						stat.du.forEach((s) => {
							const d = structuredClone(stat);
							d.du = [s]; // clone but with only one du
							d.time = stat.time;
							expandData.push(d);
						});
					} else {
						expandData.push(stat);
					}
				});
				expandData = expandData.filter(
					(stat) =>
						stat.du[0] &&
						'percentused' in stat.du[0] &&
						stat.du[0].percentused >= 0 &&
						stat.du[0].percentused <= 100
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
			statpage.doPlot('div.plot', data.computerStat, dataFn, selectedStations, colorForStation);
		};

		statpage.createStationCheckboxes(allStations, stationCallback, colorForStation);

		const timeChooser = statpage.initTimeChooser(Duration.fromISO('PT120M'), (timerange) => {
			console.log('time change...');
			//data.batterystats = await jsonl_loader.loadKilovaultStats(selectedStations, timerange).then(handleData);
		});

		handleData(data.computerStat);
	});
</script>

<svelte:head>
	<title>Battery Status</title>
</svelte:head>

<div>
	<sp-timerange duration="PT120M"></sp-timerange>
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
