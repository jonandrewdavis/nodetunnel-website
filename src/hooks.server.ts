import type { Handle } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;

	const sessionId = event.cookies.get(SESSION_COOKIE);
	const db = event.platform?.env.DB;

	if (sessionId && db) {
		const row = await db
			.prepare(
				`SELECT s.expires AS expires, u.id AS id, u.email AS email
				 FROM sessions s JOIN users u ON u.id = s.user_id
				 WHERE s.id = ?`
			)
			.bind(sessionId)
			.first<{ expires: number; id: string; email: string }>();

		if (row && row.expires > Date.now()) {
			event.locals.user = { id: row.id, email: row.email };
		} else if (row) {
			// Expired: clean up so the row and cookie don't linger.
			await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
			event.cookies.delete(SESSION_COOKIE, { path: '/' });
		}
	}

	return resolve(event);
};
