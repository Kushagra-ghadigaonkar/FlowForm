import Link from "next/link";
import type { Metadata } from "next";
import type React from "react";
import {
  ArrowRight,
  BookOpen,
  Code2,
  Database,
  ExternalLink,
  FileJson,
  FileText,
  LockKeyhole,
  Send,
  ShieldCheck,
} from "lucide-react";

import { SiteNav } from "~/components/forms/site-nav";

export const metadata: Metadata = {
  title: "API Docs - FlowForm",
  description: "FlowForm API documentation for forms, authentication, submissions, analytics, and exports.",
};

const configuredApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/trpc";
const apiBaseUrl = configuredApiUrl
  .replace(/\/$/, "")
  .replace(/\/trpc$/, "")
  .replace(/\/api$/, "");
const scalarDocsUrl = `${apiBaseUrl.replace(/\/$/, "")}/docs`;
const openApiUrl = `${apiBaseUrl.replace(/\/$/, "")}/openapi.json`;
const markdownDocsUrl = "/api-documentation.md";

const endpoints = [
  {
    method: "GET",
    route: "health",
    path: "/health",
    auth: "Public",
    description: "Health check for Render/Vercel monitors.",
  },
  {
    method: "GET",
    route: "openapi",
    path: "/openapi.json",
    auth: "Public",
    description: "Generated OpenAPI document used by Scalar.",
  },
  {
    method: "GET",
    route: "scalar",
    path: "/docs",
    auth: "Public",
    description: "Interactive Scalar API reference rendered from the OpenAPI document.",
  },
  {
    method: "tRPC query",
    route: "auth.getSupportedAuthenticationProviders",
    path: "/trpc/auth.getSupportedAuthenticationProviders",
    auth: "Public",
    description: "Returns enabled auth providers, such as Google OAuth, when configured.",
  },
  {
    method: "tRPC query",
    route: "auth.me",
    path: "/trpc/auth.me",
    auth: "Optional session",
    description: "Returns the logged-in creator profile or null when there is no valid session.",
  },
  {
    method: "tRPC mutation",
    route: "auth.register",
    path: "/trpc/auth.register",
    auth: "Public",
    description: "Creates a creator account and sets an HttpOnly session cookie.",
  },
  {
    method: "tRPC mutation",
    route: "auth.login",
    path: "/trpc/auth.login",
    auth: "Public",
    description: "Logs in a creator and sets an HttpOnly session cookie.",
  },
  {
    method: "tRPC mutation",
    route: "auth.logout",
    path: "/trpc/auth.logout",
    auth: "Creator session",
    description: "Invalidates the current session and clears the auth cookie.",
  },
  {
    method: "tRPC query",
    route: "forms.list",
    path: "/trpc/forms.list",
    auth: "Creator session",
    description: "Lists all forms owned by the signed-in creator.",
  },
  {
    method: "tRPC query",
    route: "forms.publicList",
    path: "/trpc/forms.publicList",
    auth: "Public",
    description: "Lists published public forms for Explore/gallery pages. Unlisted forms are hidden.",
  },
  {
    method: "tRPC mutation",
    route: "forms.create",
    path: "/trpc/forms.create",
    auth: "Creator session",
    description: "Creates a new draft form with title, description, visibility, theme, and settings.",
  },
  {
    method: "tRPC query",
    route: "forms.byId",
    path: "/trpc/forms.byId",
    auth: "Creator session",
    description: "Loads a creator-owned form by ID for the builder.",
  },
  {
    method: "GET",
    route: "forms.publicBySlug",
    path: "/api/forms/{slug}",
    auth: "Public",
    description: "Loads a published public or unlisted form by slug for the public fill page.",
  },
  {
    method: "tRPC mutation",
    route: "forms.update",
    path: "/trpc/forms.update",
    auth: "Creator session",
    description: "Updates form metadata such as title, description, slug, visibility, theme, and settings.",
  },
  {
    method: "tRPC mutation",
    route: "forms.saveBuilder",
    path: "/trpc/forms.saveBuilder",
    auth: "Creator session",
    description: "Saves the full dynamic builder schema: questions, options, validation rules, theme, and settings.",
  },
  {
    method: "tRPC mutation",
    route: "forms.publish",
    path: "/trpc/forms.publish",
    auth: "Creator session",
    description: "Publishes a form so respondents can open its share link. Public forms also appear in Explore.",
  },
  {
    method: "tRPC mutation",
    route: "forms.unpublish",
    path: "/trpc/forms.unpublish",
    auth: "Creator session",
    description: "Moves a form back to draft status and stops public submissions.",
  },
  {
    method: "tRPC mutation",
    route: "forms.remove",
    path: "/trpc/forms.remove",
    auth: "Creator session",
    description: "Deletes a form and its related questions, share link state, responses, and analytics.",
  },
  {
    method: "POST",
    route: "responses.submit",
    path: "/api/responses",
    auth: "Public",
    description: "Submits answers to a published form. Includes Zod validation, rate limiting, and honeypot spam checks.",
  },
  {
    method: "tRPC query",
    route: "responses.listByForm",
    path: "/trpc/responses.listByForm",
    auth: "Creator session",
    description: "Lists all responses for a creator-owned form.",
  },
  {
    method: "tRPC query",
    route: "responses.summary",
    path: "/trpc/responses.summary",
    auth: "Creator session",
    description: "Returns analytics totals, question counts, and answer distribution counts.",
  },
  {
    method: "tRPC mutation",
    route: "responses.exportCsv",
    path: "/trpc/responses.exportCsv",
    auth: "Creator session",
    description: "Exports form responses as CSV content with a generated filename.",
  },
];

const fieldTypes = [
  "short_text",
  "long_text",
  "email",
  "number",
  "single_choice",
  "multiple_choice",
  "dropdown",
  "date",
  "rating",
  "yes_no",
];

export default function ApiDocsPage() {
  return (
    <main className="theme-flowform-kingdom min-h-screen overflow-hidden text-zinc-200 selection:bg-zinc-200 selection:text-zinc-950">
      <SiteNav active="docs" />

      <section className="relative border-b-3 border-black px-5 py-20 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/20 to-zinc-950" />
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded border-2 border-black bg-zinc-200 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-950 shadow-[3px_3px_0px_#000]">
              <BookOpen className="size-3.5" />
              Developer Reference
            </span>
            <h1 className="font-flow-display mt-7 text-5xl leading-[1.05] text-white tracking-tight md:text-7xl drop-shadow-[5px_5px_0px_#000]">
              FlowForm API Documentation
            </h1>
            <p className="mt-6 max-w-2xl text-sm font-semibold leading-7 text-zinc-400">
              Use the FlowForm API to fetch published forms, submit public responses, manage builder schemas,
              publish campaigns, export responses, and power analytics dashboards.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border-2 border-black bg-zinc-200 px-5 text-xs font-black uppercase tracking-wider text-zinc-950 shadow-[4px_4px_0px_#000] hover:bg-white active:scale-95 transition"
                href={scalarDocsUrl}
                target="_blank"
              >
                Open Scalar docs
                <ExternalLink className="size-4" />
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border-2 border-black bg-zinc-950 px-5 text-xs font-black uppercase tracking-wider text-zinc-300 shadow-[4px_4px_0px_#000] hover:bg-zinc-900 hover:text-white active:scale-95 transition"
                href={openApiUrl}
                target="_blank"
              >
                OpenAPI JSON
                <FileJson className="size-4" />
              </Link>
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border-2 border-black bg-zinc-950 px-5 text-xs font-black uppercase tracking-wider text-zinc-300 shadow-[4px_4px_0px_#000] hover:bg-zinc-900 hover:text-white active:scale-95 transition"
                href={markdownDocsUrl}
                target="_blank"
              >
                Markdown docs
                <FileText className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-7 px-5 py-16 lg:grid-cols-[340px_minmax(0,1fr)] lg:px-8">
        <aside className="h-fit rounded-xl border-2 border-black bg-zinc-950 p-6 shadow-[5px_5px_0px_#000]">
          <h2 className="font-flow-display text-2xl text-white">Quick Start</h2>
          <div className="mt-5 space-y-4 text-xs font-semibold leading-6 text-zinc-450">
            <p>
              Public respondents do not need auth. Creator operations use the HttpOnly session cookie returned by login/register.
            </p>
            <div className="rounded-lg border-2 border-black bg-zinc-900 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Base URLs</p>
              <code className="mt-2 block break-all text-zinc-200">{apiBaseUrl}</code>
              <code className="mt-1 block break-all text-zinc-200">{`${apiBaseUrl.replace(/\/$/, "")}/trpc`}</code>
            </div>
            <div className="grid gap-3">
              <InfoPill icon={<ShieldCheck className="size-4" />} label="Zod validated payloads" />
              <InfoPill icon={<LockKeyhole className="size-4" />} label="Protected creator routes" />
              <InfoPill icon={<Database className="size-4" />} label="Drizzle-backed data model" />
            </div>
          </div>
        </aside>

        <div className="space-y-7">
          <section className="rounded-xl border-2 border-black bg-zinc-950 shadow-[6px_6px_0px_#000]">
            <div className="border-b-2 border-black p-5">
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Endpoint Index</p>
              <h2 className="font-flow-display mt-1 text-2xl text-white">Routes and what they do</h2>
            </div>
            <div className="divide-y-2 divide-black">
              {endpoints.map((endpoint) => (
                <article className="grid gap-3 p-5 lg:grid-cols-[130px_minmax(260px,1fr)_150px] lg:items-center" key={`${endpoint.method}-${endpoint.route}`}>
                  <span className="w-fit rounded border-2 border-black bg-zinc-200 px-2.5 py-1 text-[10px] font-black text-zinc-950 shadow-[2px_2px_0px_#000]">
                    {endpoint.method}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-zinc-100">{endpoint.route}</p>
                    <code className="mt-1 block break-all text-[11px] font-bold text-zinc-400">{endpoint.path}</code>
                    <p className="mt-2 text-xs font-semibold leading-5 text-zinc-500">{endpoint.description}</p>
                  </div>
                  <span className="w-fit rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                    {endpoint.auth}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-7 xl:grid-cols-2">
            <CodeCard
              icon={<Send className="size-4" />}
              title="Submit a public response"
              code={`POST /api/responses
Content-Type: application/json

{
  "slug": "msdos-retro-survey",
  "answers": [
    {
      "questionId": "3f6a8b7e-0c8e-4f38-8cf8-0d5d912e5a44",
      "value": "Nitesh"
    }
  ],
  "metadata": {
    "source": "website",
    "website": ""
  }
}`}
            />
            <CodeCard
              icon={<Code2 className="size-4" />}
              title="Create a builder schema"
              code={`forms.saveBuilder({
  formId: "form-uuid",
  title: "Launch feedback",
  visibility: "public",
  questions: [
    {
      type: "email",
      title: "Work email",
      required: true,
      validation: { pattern: ".+@.+" }
    }
  ]
})`}
            />
          </section>

          <section className="rounded-xl border-2 border-black bg-zinc-950 p-6 shadow-[6px_6px_0px_#000]">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Dynamic schemas</p>
            <h2 className="font-flow-display mt-1 text-2xl text-white">Supported field types</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              {fieldTypes.map((type) => (
                <span className="rounded border-2 border-black bg-zinc-900 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-300 shadow-[2px_2px_0px_#000]" key={type}>
                  {type}
                </span>
              ))}
            </div>
            <Link className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-white" href="/dashboard">
              Try it from the dashboard
              <ArrowRight className="size-4" />
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}

function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border-2 border-black bg-zinc-950 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-zinc-300 shadow-[2px_2px_0px_#000]">
      {icon}
      {label}
    </div>
  );
}

function CodeCard({ code, icon, title }: { code: string; icon: React.ReactNode; title: string }) {
  return (
    <article className="rounded-xl border-2 border-black bg-zinc-950 p-5 shadow-[5px_5px_0px_#000]">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg border-2 border-black bg-zinc-900 text-zinc-300">
          {icon}
        </span>
        <h3 className="text-sm font-black uppercase tracking-wider text-zinc-200">{title}</h3>
      </div>
      <pre className="mt-4 overflow-x-auto rounded-lg border-2 border-black bg-black p-4 text-[11px] leading-5 text-zinc-300">
        <code>{code}</code>
      </pre>
    </article>
  );
}
