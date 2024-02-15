import type { PageLoad } from './$types';

import { Duration, Interval, DateTime } from 'luxon';

export const load: PageLoad = async ({ params, depends, data, fetch }) => {
	depends('data:computerStat');
	depends('data:allStations');
	const sp = await import('seisplotjs');
	sp.util.setDefaultFetch(fetch);
	const jsonl_loader = await import('$lib/jsonl_loader.ts');

	const allStations = ['BIRD', 'CASEE', 'CSB', 'HAW', 'HODGE', 'JSC', 'PAULI', 'TEEBA'];
	const timerange = Interval.before(DateTime.utc(), Duration.fromISO('PT120M'));
	let dataPromise = await jsonl_loader.loadComputerStats(allStations, timerange);
	return {
		computerStat: dataPromise,
		allStations: allStations
	};
};
