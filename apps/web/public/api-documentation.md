# FlowForm API Documentation

FlowForm is a Typeform-style form builder SaaS. Creators can create dynamic forms, publish public or unlisted share links, collect public responses, and view analytics.

The API uses:

- tRPC for type-safe frontend/backend communication
- Zod for request and response validation
- Drizzle ORM for database models and migrations
- Scalar for interactive OpenAPI documentation

## Base URLs

Local development:

```txt
Web app: http://localhost:3000
API app: http://localhost:8000
tRPC: http://localhost:8000/trpc
OpenAPI JSON: http://localhost:8000/openapi.json
Scalar docs: http://localhost:8000/docs
```

Production:

```txt
Web app: https://<your-vercel-app>.vercel.app
API app: https://<your-render-api>.onrender.com
tRPC: https://<your-render-api>.onrender.com/trpc
OpenAPI JSON: https://<your-render-api>.onrender.com/openapi.json
Scalar docs: https://<your-render-api>.onrender.com/docs
```

## Authentication

Creator routes require an authenticated session. Login and register set an HttpOnly session cookie.

Public respondent routes do not require login.

## Route Reference

| Route | Method / Path | Auth | What it does |
| --- | --- | --- | --- |
| `health` | `GET /health` | Public | Checks whether the API server is running. |
| `openapi` | `GET /openapi.json` | Public | Returns generated OpenAPI JSON. |
| `scalar` | `GET /docs` | Public | Opens interactive Scalar API documentation. |
| `auth.getSupportedAuthenticationProviders` | `/trpc/auth.getSupportedAuthenticationProviders` | Public | Returns configured auth providers. |
| `auth.me` | `/trpc/auth.me` | Optional session | Returns the current creator user or `null`. |
| `auth.register` | `/trpc/auth.register` | Public | Creates a creator account and starts a session. |
| `auth.login` | `/trpc/auth.login` | Public | Logs in a creator and starts a session. |
| `auth.logout` | `/trpc/auth.logout` | Creator session | Logs out and clears the session cookie. |
| `forms.list` | `/trpc/forms.list` | Creator session | Lists all forms owned by the logged-in creator. |
| `forms.publicList` | `/trpc/forms.publicList` | Public | Lists published public forms for Explore/gallery pages. |
| `forms.create` | `/trpc/forms.create` | Creator session | Creates a new draft form. |
| `forms.byId` | `/trpc/forms.byId` | Creator session | Loads one creator-owned form by ID. |
| `forms.publicBySlug` | `GET /api/forms/{slug}` or `/trpc/forms.publicBySlug` | Public | Loads a published form by slug for public filling. |
| `forms.update` | `/trpc/forms.update` | Creator session | Updates form metadata such as title, slug, visibility, theme, and settings. |
| `forms.saveBuilder` | `/trpc/forms.saveBuilder` | Creator session | Saves the full dynamic form schema. |
| `forms.publish` | `/trpc/forms.publish` | Creator session | Publishes a form so it can accept responses. |
| `forms.unpublish` | `/trpc/forms.unpublish` | Creator session | Moves a form back to draft and blocks public submissions. |
| `forms.remove` | `/trpc/forms.remove` | Creator session | Deletes a form and related responses/analytics. |
| `responses.submit` | `POST /api/responses` or `/trpc/responses.submit` | Public | Submits answers to a published form. |
| `responses.listByForm` | `/trpc/responses.listByForm` | Creator session | Lists responses for a creator-owned form. |
| `responses.summary` | `/trpc/responses.summary` | Creator session | Returns analytics totals and answer counts. |
| `responses.exportCsv` | `/trpc/responses.exportCsv` | Creator session | Exports responses as CSV. |

## Form Visibility

FlowForm supports two published visibility modes:

| Visibility | Behavior |
| --- | --- |
| `public` | Published form appears in public sections like Explore and can be submitted by anyone. |
| `unlisted` | Published form is hidden from public listings but can be opened by direct link. |

Draft forms do not accept public responses.

## Supported Field Types

```txt
short_text
long_text
email
number
single_choice
multiple_choice
dropdown
date
rating
yes_no
```

## Validation Rules

Each question can define validation rules:

```ts
{
  minLength?: number | null;
  maxLength?: number | null;
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
}
```

Zod validates form schemas and public response submissions before data is saved.

## Auth Routes

### Register

```ts
auth.register({
  fullName: "Demo Creator",
  email: "judge@flowform.io",
  password: "spider-sense-2026"
})
```

Creates a creator account and starts a session.

### Login

```ts
auth.login({
  email: "judge@flowform.io",
  password: "spider-sense-2026"
})
```

Logs in a creator and sets the auth cookie.

### Current User

```ts
auth.me()
```

Returns the current user or `null`.

### Logout

```ts
auth.logout()
```

Clears the current session.

## Forms Routes

### Create Form

```ts
forms.create({
  title: "Launch feedback",
  description: "Tell us what to improve before launch.",
  visibility: "unlisted",
  theme: {
    background: "#050507",
    text: "#f4f4f5",
    accent: "#e4e4e7",
    preset: "noir"
  },
  settings: {
    showProgress: true,
    collectEmail: false,
    expiresAt: null,
    responseLimit: 500
  }
})
```

Creates a new draft form owned by the current creator.

### Save Builder Schema

```ts
forms.saveBuilder({
  formId: "form-uuid",
  title: "Launch feedback",
  description: "A short launch survey",
  visibility: "public",
  theme: {
    background: "#050507",
    text: "#f4f4f5",
    accent: "#e4e4e7",
    preset: "noir"
  },
  settings: {
    showProgress: true,
    collectEmail: true,
    expiresAt: null,
    responseLimit: 1000
  },
  questions: [
    {
      type: "email",
      title: "Work email",
      required: true,
      placeholder: "you@company.com",
      validation: {
        pattern: ".+@.+"
      }
    },
    {
      type: "single_choice",
      title: "What best describes you?",
      required: true,
      options: [
        { label: "Founder", value: "founder" },
        { label: "Product manager", value: "pm" },
        { label: "Developer", value: "developer" }
      ]
    }
  ]
})
```

Saves all builder data for a form, including questions, options, validations, theme, and settings.

### Publish Form

```ts
forms.publish({ formId: "form-uuid" })
```

Publishes the form. Once published, the public link can accept responses.

### Unpublish Form

```ts
forms.unpublish({ formId: "form-uuid" })
```

Returns the form to draft status and blocks public submissions.

### Delete Form

```ts
forms.remove({ formId: "form-uuid" })
```

Deletes the form and related responses/analytics.

## Public Form Routes

### Get Form by Slug

```http
GET /api/forms/{slug}
```

Returns a published public or unlisted form by slug.

Example:

```http
GET /api/forms/msdos-retro-survey
```

## Response Routes

### Submit Public Response

```http
POST /api/responses
Content-Type: application/json
```

Request:

```json
{
  "slug": "msdos-retro-survey",
  "answers": [
    {
      "questionId": "3f6a8b7e-0c8e-4f38-8cf8-0d5d912e5a44",
      "value": "Nitesh"
    },
    {
      "questionId": "09d9cd2f-9d91-44cb-bca5-b73777f92323",
      "value": ["founder", "developer"]
    }
  ],
  "metadata": {
    "source": "website",
    "website": ""
  }
}
```

Response:

```json
{
  "responseId": "response-uuid",
  "submittedAt": "2026-05-27T10:30:00.000Z"
}
```

Submission protections:

- Respondents do not need login.
- Draft/unpublished forms reject submissions.
- Expired forms reject submissions.
- Forms over response limit reject submissions.
- Honeypot metadata rejects bots.
- Rate limit: 10 submissions per 10 minutes per IP and form slug.

### List Responses

```ts
responses.listByForm({ formId: "form-uuid" })
```

Returns all responses for a form owned by the current creator.

### Analytics Summary

```ts
responses.summary({ formId: "form-uuid" })
```

Returns:

```json
{
  "formId": "form-uuid",
  "totalResponses": 124,
  "questionCount": 5,
  "questions": [
    {
      "questionId": "question-uuid",
      "title": "What best describes you?",
      "type": "single_choice",
      "responseCount": 124,
      "counts": {
        "Founder": 52,
        "Developer": 47,
        "Product manager": 25
      }
    }
  ]
}
```

### Export CSV

```ts
responses.exportCsv({ formId: "form-uuid" })
```

Returns:

```json
{
  "filename": "launch-feedback-responses.csv",
  "csv": "submittedAt,email,question..."
}
```

## Error Handling

Common errors:

| Error | Meaning |
| --- | --- |
| `UNAUTHORIZED` | Protected route called without a valid session. |
| `FORBIDDEN` | Creator tried to access another creator's resource. |
| `BAD_REQUEST` | Invalid payload, invalid form state, or spam protection triggered. |
| `TOO_MANY_REQUESTS` | Public response submission rate limit reached. |
| `NOT_FOUND` | Requested form or response does not exist. |

## Deployment Environment Variables

Frontend:

```txt
NEXT_PUBLIC_API_URL=https://<your-render-api>.onrender.com/trpc
```

Backend:

```txt
NODE_ENV=production
BASE_URL=https://<your-render-api>.onrender.com
WEB_APP_URL=https://<your-vercel-app>.vercel.app
DATABASE_URL=<render-postgres-url>
EMAIL_USER=<gmail-address>
EMAIL_PASS=<gmail-app-password>
```

## Demo Credentials

```txt
Email: judge@flowform.io
Password: spider-sense-2026
```
