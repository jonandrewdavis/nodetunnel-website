import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Consumed by the relay-server's remote whitelist check
// (GET {endpoint}/{appId} with an X-Relay-Token header). Replaces the old
// PocketBase pb_hooks route of the same shape: 200 = app exists, 404 = not,
// 401 = bad/missing token.
export const GET: RequestHandler = async ({ params, request, platform }) => {
	const expected = platform?.env.RELAY_TOKEN;
	const token = request.headers.get('X-Relay-Token');

	if (!expected || token !== expected) {
		return json({ error: 'unauthorized' }, { status: 401 });
	}

	const app = await platform!.env.DB.prepare('SELECT id FROM apps WHERE id = ?')
		.bind(params.appId)
		.first<{ id: string }>();

	return json({}, { status: app ? 200 : 404 });
};
