import { fail, redirect } from '@sveltejs/kit';
import { generateId } from '$lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	if (!locals.user) throw redirect(303, '/login');

	const { results } = await platform!.env.DB.prepare(
		'SELECT id, name, description FROM apps WHERE dev = ? ORDER BY created DESC'
	)
		.bind(locals.user.id)
		.all<{ id: string; name: string; description: string }>();

	return { user: locals.user, apps: results };
};

export const actions: Actions = {
	create: async ({ request, locals, platform }) => {
		if (!locals.user) throw redirect(303, '/login');

		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();

		if (!name) {
			return fail(400, { error: 'Name is required.' });
		}

		const id = generateId();
		await platform!.env.DB.prepare(
			'INSERT INTO apps (id, name, description, dev) VALUES (?, ?, ?, ?)'
		)
			.bind(id, name, description, locals.user.id)
			.run();

		return { success: true };
	}
};
