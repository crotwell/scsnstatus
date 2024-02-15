export const ssr = false;
import type { PageLoad } from './$types';

const SC_QUAKE_URL = 'https://eeyore.seis.sc.edu/scsn/sc_quakes/sc_quakes.xml';
const SC_STATION_URL = 'https://eeyore.seis.sc.edu/scsn/sc_quakes/CO_channels.staml';

export const load: PageLoad = async ({ params, depends, data }) => {
	depends('data:qml');
	depends('data:staxml');
	const sp = await import('seisplotjs');

	const quakeQuery = sp.quakeml.fetchQuakeML(SC_QUAKE_URL);
	const chanQuery = sp.stationxml.fetchStationXml(SC_STATION_URL).then((staxml) => {
		// filter so only HH? and HN?
		staxml.forEach((net) => {
			net.stations.forEach((sta) => {
				sta.channels = sta.channels.filter(
					(ch) =>
						ch.channelCode.startsWith('H') &&
						(ch.channelCode.charAt(1) === 'H' || ch.channelCode.charAt(1) === 'N') &&
						ch.channelCode.charAt(2) === 'Z'
				);
			});
			//net.stations = net.stations.filter(sta => sta.stationCode === "JSC" || sta.stationCode === "PARR");
			net.stations = net.stations.filter((sta) => sta.channels.length > 0);
		});
		staxml = staxml.filter((net) => net.stations.length > 0);
		return staxml;
	});
	const qml = await quakeQuery;
	const staxml = await chanQuery;
	console.log(`got sc eq data : ${qml.length}`);
	return {
		post: {
			title: `Title for ${params.slug} goes here`,
			content: `Content for ${params.slug} goes here`
		},
		quake_url: SC_QUAKE_URL,
		station_url: SC_STATION_URL,
		qml: qml,
		staxml: staxml,
		spjsversion: sp.version
	};
};
