// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { D1Database } from '@cloudflare/workers-types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: { id: string; email: string } | null;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database;
				/** Shared secret required by the /app-exists relay endpoint. */
				RELAY_TOKEN: string;
			};
			cf: CfProperties;
			ctx: ExecutionContext;
		}
	}
}

export {};
