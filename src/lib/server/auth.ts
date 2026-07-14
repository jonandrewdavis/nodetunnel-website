// Password hashing, id generation and session helpers. Runs on the Cloudflare
// Workers runtime, so everything uses Web Crypto (no Node built-ins).

const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;

const encoder = new TextEncoder();

function toHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
	const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return bytes;
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, [
		'deriveBits'
	]);
	const bits = await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
		key,
		HASH_BYTES * 8
	);
	return new Uint8Array(bits);
}

/** Returns a `salt:hash` (hex) string suitable for storing in the DB. */
export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const hash = await derive(password, salt);
	return `${toHex(salt)}:${toHex(hash)}`;
}

/** Constant-time-ish verification of a password against a stored `salt:hash`. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [saltHex, hashHex] = stored.split(':');
	if (!saltHex || !hashHex) return false;
	const expected = fromHex(hashHex);
	const actual = await derive(password, fromHex(saltHex));
	if (actual.length !== expected.length) return false;
	let diff = 0;
	for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
	return diff === 0;
}

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Lowercase alphanumeric id, matching the old PocketBase `[a-z0-9]{15}` ids. */
export function generateId(length = 15): string {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	let out = '';
	for (let i = 0; i < length; i++) out += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
	return out;
}

/** Opaque, high-entropy session token stored in the sessions table + cookie. */
export function generateSessionId(): string {
	return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
