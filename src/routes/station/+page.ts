import type { PageLoad } from './$types';

const SC_STATION_URL = 'https://eeyore.seis.sc.edu/scsn/sc_quakes/CO_channels.staml';

export const load: PageLoad = async ({ fetch, params }) => {
	const res = await fetch(SC_STATION_URL);
	const rawXmlText = await res.text();
	return { rawstationxml: rawXmlText };
};
