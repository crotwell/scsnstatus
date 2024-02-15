import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent }) => {
	const parent_data = await parent();
	console.log(`data has quakes: ${parent_data.qml != null}`);
	if (params.quake) {
		return {
			title: 'Hello world!',
			content: `Quake: ${params.quake}`,
			quakeml_id: params.quake,
			quake: parent_data.qml.eventList.find((q) => q.eventId === params.quake),
			inventory: parent_data.staxml,
			spjsversion: parent_data.spjsversion
		};
	}
	error(404, 'Not found');
};
