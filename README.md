# FlowForm

FlowForm is a production-style Typeform SaaS built on the provided Turborepo starter. It includes a separate Next.js frontend, Express/tRPC backend, shared Zod schemas, Drizzle ORM models, PostgreSQL migrations, Scalar API documentation, authentication, public form links, response collection, analytics, and seeded demo data.

## Demo

- Web app: http://localhost:3000
- API server: http://localhost:8000
- Scalar API docs: http://localhost:8000/docs
- OpenAPI JSON: http://localhost:8000/openapi.json

Demo creator account:

```txt
Email: judge@flowform.io
Password: spider-sense-2026
```

The demo account is bootstrapped automatically. Seeded public forms, unlisted forms, themes, questions, responses, and analytics are created when the dashboard or public gallery loads.

## Features

- Creator authentication with secure cookie sessions.
- Protected dashboard for creating, editing, publishing, unpublishing, and managing forms.
- Dynamic form builder with short text, long text, email, number, single select, multi select, dropdown, rating, date, and yes/no fields.
- Zod-backed builder and response validation, including required fields, min/max length, min/max numeric values, regex patterns, and option validation.
- Public and unlisted visibility modes.
- Public Explore page that lists only public published forms.
- Direct public runner at `/f/{slug}` for unauthenticated respondents.
- Graceful handling for invalid, unpublished, expired, and response-limited forms.
- Response analytics, answer summaries, response detail view, and CSV export.
- Rate limiting and honeypot spam protection on public response submission.
- Nodemailer email notifications for creator/respondent submission flows.
- Landing page, pricing page, frontend API docs page, Scalar backend docs, and seeded themed forms.

## Monorepo Layout

```txt
apps/
  api/          Express API, tRPC adapter, OpenAPI, Scalar docs
  web/          Next.js app, landing page, dashboard, builder, runner
packages/
  database/     Drizzle schema, migrations, PostgreSQL connection
  services/     Auth, forms, responses, email flow, Zod service models
  trpc/         tRPC router, context, protected/public procedures
  logger/       Shared logger
  typescript-config/
```

The original starter structure is preserved: frontend and backend remain separate apps inside the same Turborepo, and shared logic lives in packages.

## Stack

- Turborepo
- Next.js
- Express
- tRPC
- Zod
- Drizzle ORM
- PostgreSQL
- Scalar API Reference
- Tailwind CSS
- React Query

## Local Setup

Install dependencies:

```sh
pnpm install
```

Create a root `.env` file:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dev
BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/trpc
NODE_ENV=development
WEB_APP_URL=http://localhost:3000
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM="FlowForm <your-gmail-address@gmail.com>"
```

Run migrations:

```sh
pnpm --filter @repo/database db:migrate
```

Start both apps:

```sh
pnpm dev
```

Or run them separately:

```sh
pnpm --filter @repo/api dev
pnpm --filter web dev
```

## Useful Routes

- `/` - SaaS landing page and demo showcase.
- `/pricing` - Pricing page.
- `/explore` - Public form gallery.
- `/dashboard` - Creator dashboard and auth screen.
- `/forms/{id}/builder` - Form builder.
- `/forms/{id}/results` - Responses, analytics, CSV export.
- `/f/{slug}` - Public respondent form runner.
- `http://localhost:8000/docs` - Scalar API docs.

## API Notes

The backend exposes tRPC at:

```txt
http://localhost:8000/trpc
```

OpenAPI routes are exposed at:

```txt
http://localhost:8000/api
```

Documented public endpoints include fetching a published form by slug and submitting a response. Protected creator endpoints use the session cookie set by authentication.

## Validation And Visibility

Field schemas are stored dynamically in PostgreSQL while Zod validates all creator and respondent payloads. Public users can submit only published forms. Visibility behaves as follows:

- Public: published and visible in Explore/landing public sections.
- Unlisted: published and accessible only through the direct `/f/{slug}` link.
- Draft: not publicly accessible and does not accept responses.

## Verification

```sh
pnpm check-types
pnpm build
```

The current local database migration has been applied through Drizzle. The latest migration adds form visibility support.

## Deployment

This repo is ready for a two-service deployment: the API runs separately from the Next.js web app.

### 1. Deploy API and PostgreSQL on Render

The root `render.yaml` provisions:

- `flowform-postgres` - Render PostgreSQL
- `flowform-api` - Express/tRPC API

In Render, create a new Blueprint from this repository. Render will prompt for these secret or deployment-specific values:

```txt
BASE_URL=https://your-flowform-api.onrender.com
WEB_APP_URL=https://your-flowform-web.vercel.app
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-gmail-app-password
EMAIL_FROM=FlowForm <your-gmail-address@gmail.com>
```

The API build runs database migrations before deploy and exposes:

```txt
https://your-flowform-api.onrender.com/health
https://your-flowform-api.onrender.com/docs
https://your-flowform-api.onrender.com/trpc
```

### 2. Deploy Web on Vercel

Import the same GitHub repository into Vercel and select:

```txt
Root Directory: apps/web
Framework: Next.js
Install Command: pnpm install
Build Command: pnpm build
Output Directory: .next
```

Set this Vercel environment variable:

```txt
NEXT_PUBLIC_API_URL=https://your-flowform-api.onrender.com/trpc
```

After Vercel gives you the web URL, update the Render API `WEB_APP_URL` to that Vercel URL. This is required for production CORS and auth cookies.

### Production Auth Notes

The API uses credentialed CORS and production cookies for cross-origin deployment. In production, set `NODE_ENV=production` on the API service so session cookies are sent with `SameSite=None; Secure`.

## Deployment Checklist

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Set `BASE_URL` to the deployed API origin.
3. Set `NEXT_PUBLIC_API_URL` to the deployed API `/trpc` endpoint.
4. Set `WEB_APP_URL`, `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM` for Nodemailer.
5. Run Drizzle migrations before starting the API.
6. Deploy `apps/api` and `apps/web` as separate services.
7. Share the deployed web URL, Scalar docs URL, and demo credentials above.
