import { fail, redirect } from '@sveltejs/kit';
import { generateId, hashPassword } from '$lib/server/auth';
import { startSession } from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/dashboard');
};

export const actions: Actions = {
	default: async ({ request, cookies, platform }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim();
		const password = String(data.get('password') ?? '');
		const confirm = String(data.get('confirm') ?? '');

		if (!email || !password) {
			return fail(400, { email, error: 'Email and password are required.' });
		}
		if (password.length < 8) {
			return fail(400, { email, error: 'Password must be at least 8 characters.' });
		}
		if (password !== confirm) {
			return fail(400, { email, error: 'Passwords must match.' });
		}

		const db = platform!.env.DB;
		const id = generateId();
		const passwordHash = await hashPassword(password);

		try {
			await db
				.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
				.bind(id, email, passwordHash)
				.run();
		} catch (err) {
			// UNIQUE constraint on email
			if (err instanceof Error && err.message.includes('UNIQUE')) {
				return fail(400, { email, error: 'An account with that email already exists.' });
			}
			throw err;
		}

		await startSession(db, cookies, id);
		throw redirect(303, '/dashboard');
	}
};
