# Order API Worker

Cloudflare Worker that receives order payloads from the order center UI and forwards them to Resend.

## Required secrets

- `RESEND_API_KEY`

## Required vars

- `MAIL_FROM`
- `MAIL_TO`
- `ALLOWED_ORIGINS`

## Deploy

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

If you prefer to run the commands from the worker directory:

```bash
cd workers/order-api
npx wrangler secret put RESEND_API_KEY
npx wrangler deploy
```

## Local development

Create a `.dev.vars` file next to `wrangler.toml` for local testing.

```env
RESEND_API_KEY=replace-me
```

Do not commit the `.dev.vars` file.

## Frontend config

Set `window.__ORDER_CENTER_CONFIG__.orderApi.endpoint` to the deployed Worker URL, for example:

```js
window.__ORDER_CENTER_CONFIG__ = {
  orderApi: {
    endpoint: "https://ggr-order-api.example.workers.dev",
  },
};
```

## What stays out of git

- `RESEND_API_KEY`
- `.dev.vars`
- `.env`
- any `*.local` secret file
