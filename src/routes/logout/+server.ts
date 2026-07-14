import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies, platform }) => {
	const sessionId = cookies.get(SESSION_COOKIE);
	if (sessionId && platform) {
		await platform.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
	throw redirect(303, '/');
};
