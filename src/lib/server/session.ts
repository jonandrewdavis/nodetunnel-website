import type { Cookies } from '@sveltejs/kit';
import type { D1Database } from '@cloudflare/workers-types';
import { SESSION_COOKIE, SESSION_TTL_MS, generateSessionId } from './auth';

/** Creates a session row and sets the httpOnly session cookie. */
export async function startSession(
	db: D1Database,
	cookies: Cookies,
	userId: string
): Promise<void> {
	const id = generateSessionId();
	const expires = Date.now() + SESSION_TTL_MS;

	await db
		.prepare('INSERT INTO sessions (id, user_id, expires) VALUES (?, ?, ?)')
		.bind(id, userId, expires)
		.run();

	cookies.set(SESSION_COOKIE, id, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: Math.floor(SESSION_TTL_MS / 1000)
	});
}
