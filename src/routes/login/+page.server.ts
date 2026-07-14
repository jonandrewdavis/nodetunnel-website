import { fail, redirect } from '@sveltejs/kit';
import { verifyPassword } from '$lib/server/auth';
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

		if (!email || !password) {
			return fail(400, { email, error: 'Email and password are required.' });
		}

		const db = platform!.env.DB;
		const user = await db
			.prepare('SELECT id, password_hash FROM users WHERE email = ?')
			.bind(email)
			.first<{ id: string; password_hash: string }>();

		if (!user || !(await verifyPassword(password, user.password_hash))) {
			return fail(400, { email, error: 'Invalid email or password.' });
		}

		await startSession(db, cookies, user.id);
		throw redirect(303, '/dashboard');
	}
};
