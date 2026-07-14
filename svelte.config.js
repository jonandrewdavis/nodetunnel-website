import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Deploys to Cloudflare Workers. Bindings (D1, secrets) declared in
		// wrangler.jsonc are available on `event.platform.env` and are emulated
		// during `vite dev` by the adapter.
		adapter: adapter()
	}
};

export default config;
