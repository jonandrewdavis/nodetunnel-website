# nodetunnel-website

The NodeTunnel marketing site and developer dashboard. Built with SvelteKit and
deployed to **Cloudflare Workers** via [`@sveltejs/adapter-cloudflare`](https://svelte.dev/docs/kit/adapter-cloudflare).

Data lives in **Cloudflare D1** (a single `nodetunnel` database). This replaces
the former standalone PocketBase `db` repo, which has been folded into this
project — see [`migrations/`](./migrations) for the schema.

## Architecture

- **Auth** — email/password. Passwords are hashed with PBKDF2 (Web Crypto) and
  stored in D1. Sessions are server-side (`sessions` table) keyed by an
  httpOnly cookie. See `src/lib/server/`.
- **Routes** — everything runs server-side (SvelteKit `load` functions and form
  actions). `src/hooks.server.ts` resolves the session cookie into
  `locals.user`.
- **`GET /app-exists/{appId}`** — used by the [relay-server](https://github.com/NodeTunnel/relay-server)
  as its remote whitelist. Requires an `X-Relay-Token` header matching the
  `RELAY_TOKEN` secret; returns `200` if the app exists, `404` if not, `401` on
  a bad token. This preserves the contract of the old PocketBase `pb_hooks` route.

## Bindings

Declared in `wrangler.jsonc`:

| Binding       | Type              | Purpose                              |
| ------------- | ----------------- | ------------------------------------ |
| `DB`          | D1 Database       | users, apps, sessions                |
| `RELAY_TOKEN` | Secret            | auth for the `/app-exists` endpoint  |
| `ASSETS`      | Static assets     | managed by the adapter               |

## Developing

```sh
pnpm install

# one-time: seed a local D1 database from the migrations
pnpm exec wrangler d1 migrations apply nodetunnel --local

# local secret used by /app-exists
cp .dev.vars.example .dev.vars

pnpm run dev
```

`vite dev` emulates the Cloudflare bindings automatically (reading
`wrangler.jsonc` + `.dev.vars`). To run the built worker instead:

```sh
pnpm run build
pnpm exec wrangler dev
```

## Deploying

First-time setup:

```sh
# create the D1 database and paste the returned id into wrangler.jsonc
pnpm exec wrangler d1 create nodetunnel

# apply the schema to the remote database
pnpm exec wrangler d1 migrations apply nodetunnel --remote

# set the relay token secret
pnpm exec wrangler secret put RELAY_TOKEN
```

Then deploy:

```sh
pnpm run deploy
```
