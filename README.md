# Bayhouse Reservations

Production-ready reservation management app built with Next.js, TypeScript, Tailwind CSS, Prisma, Postgres, Resend, and Zod.

## Features

- Create, edit, cancel, and view reservations.
- Human-readable reservation codes like `BAY-2026-000001`.
- Guest records, reservation owners, statuses, notes, and timestamps.
- Dashboard for upcoming reservations, pending replies, and recent activity.
- Full audit trail in `reservation_history`.
- Resend outbound email logging in `emails`.
- Inbound reply/webhook handling with reply tokens.
- Manual review queue for ambiguous replies.
- Basic cookie login with `admin` and `viewer` roles.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env
```

3. Set at minimum:

```bash
DATABASE_URL="postgresql://..."
SESSION_SECRET="a-long-random-string"
INITIAL_ADMIN_EMAIL="you@example.com"
INITIAL_ADMIN_PASSWORD="change-this"
```

4. Run migrations and seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

5. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Email Setup

Set these environment variables:

```bash
RESEND_API_KEY="re_..."
FROM_EMAIL="Bayhouse Reservations <reservations@yourdomain.com>"
APP_BASE_URL="https://your-app.example.com"
RESEND_WEBHOOK_SECRET="optional-shared-secret"
```

Outbound emails are written to `emails` before sending and updated with the Resend provider ID and delivery state.

Inbound reply endpoint:

```text
POST /api/inbound/replies
```

Expected JSON:

```json
{
  "from": "guest@example.com",
  "subject": "Re: BAY-2026-000001",
  "text": "Yes, we confirm. Reply token: rsv_exampletoken",
  "replyToken": "rsv_exampletoken"
}
```

Resend event webhook endpoint:

```text
POST /api/webhooks/resend
```

If `RESEND_WEBHOOK_SECRET` is set, the app checks `resend-signature` or `x-resend-signature` using HMAC SHA-256.

## Cloudflare + Supabase + Resend Deployment

Recommended low-cost setup:

1. Create a Supabase project.
2. Copy the Supabase Postgres connection string into `DATABASE_URL`.
3. Create and verify a sending domain in Resend.
4. Set `RESEND_API_KEY` and `FROM_EMAIL`.
5. Deploy the Next.js app to Cloudflare Pages.
6. Add environment variables in Cloudflare Pages:
   - `DATABASE_URL`
   - `RESEND_API_KEY`
   - `FROM_EMAIL`
   - `APP_BASE_URL`
   - `SESSION_SECRET`
   - `RESEND_WEBHOOK_SECRET`
7. Run migrations from a local trusted machine or CI:

```bash
npm run prisma:deploy
```

Cloudflare Pages may require an adapter for full Next.js server features. If you want the simplest production deployment with no adapter concerns, Railway for the app plus Railway/Supabase Postgres is the lower-friction option.

## Railway Deployment

1. Create a Railway project.
2. Add a Postgres service.
3. Add this repo as an app service.
4. Set env vars from `.env.example`.
5. Set build command:

```bash
npm run build
```

6. Set start command:

```bash
npm run start
```

7. Run:

```bash
npm run prisma:deploy
npm run prisma:seed
```

## Information Needed To Spin Up Services

- Preferred deployment target: Cloudflare + Supabase or Railway.
- Domain/subdomain for the app.
- Sending email domain and desired from address.
- Resend API key.
- Resend webhook signing secret, if configured.
- Supabase or Railway Postgres connection string.
- Initial admin email and password.
- Business timezone and default reservation duration.
- Public reply handling preference: reply-to plus-addressing, Resend inbound routing, or body-token-only fallback.

## Tests

```bash
npm test
```

Current tests cover reservation code generation, status helpers, reply classification, and reply-token matching.
