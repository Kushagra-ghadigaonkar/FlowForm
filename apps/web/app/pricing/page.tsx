"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Gift,
  Layers3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { useEffect } from "react";

import { SiteNav } from "~/components/forms/site-nav";
import { trpc } from "~/trpc/client";

const fontHref =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap";

const plans = [
  {
    label: "Starter plan",
    price: "0",
    cadence: "free quota",
    badge: "Starter",
    copy: "Launch polished public and unlisted forms for small campaigns, waitlists, and validation objectives.",
    cta: "Claim free",
    href: "/dashboard?plan=starter",
    perks: ["100 responses each month", "3 live forms", "Public gallery listing", "Basic analytics"],
  },
  {
    label: "Growth plan",
    price: "49",
    cadence: "/ month",
    badge: "Most Popular",
    copy: "For creators and startups that need unlimited campaigns, richer analytics, and cleaner response files.",
    cta: "Deploy growth",
    href: "/dashboard?plan=growth",
    featured: true,
    perks: ["10,000 responses each month", "Unlimited published forms", "Unlisted campaigns", "CSV exports"],
  },
  {
    label: "Enterprise plan",
    price: "199",
    cadence: "/ month",
    badge: "Enterprise",
    copy: "For teams running high-volume intake, waitlists, events, surveys, hiring, and internal data capture.",
    cta: "Upgrade quota",
    href: "/dashboard?plan=enterprise",
    perks: ["Unlimited responses", "Priority support", "Advanced analytics", "Team-ready workflows"],
  },
];

const platformFeatures = [
  {
    icon: Wand2,
    label: "Conversational forge",
    copy: "Create dynamic forms with text, email, number, select, checkbox, rating, and date fields.",
  },
  {
    icon: ShieldCheck,
    label: "Type validation",
    copy: "Required fields, answer rules, and response payloads are validated before database records commit.",
  },
  {
    icon: BarChart3,
    label: "Real-time ledger",
    copy: "Track responses, completion patterns, device mix, and field-level performance from the dashboard.",
  },
  {
    icon: LockKeyhole,
    label: "Visibility control",
    copy: "Publish public forms for discovery or unlisted forms for private direct-link campaigns.",
  },
];

export default function PricingPage() {
  const { data: me } = trpc.auth.me.useQuery(undefined);
  const primaryLabel = me ? "Open dashboard" : "Start free";

  useEffect(() => {
    if (document.querySelector(`link[href="${fontHref}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontHref;
    document.head.appendChild(link);
  }, []);

  return (
    <main className="theme-flowform-kingdom min-h-screen overflow-hidden text-zinc-200 selection:bg-zinc-200 selection:text-zinc-950">
      <SiteNav active="pricing" />

      <section className="flow-coc-hero-bg relative isolate border-b-3 border-black px-5 py-20 text-center lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/40 to-zinc-950" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <span className="inline-flex items-center gap-2 rounded border-2 border-black bg-zinc-200 text-zinc-950 px-4 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000]">
            QUOTA DIVISION
          </span>
          <h1 className="font-flow-display mt-7 text-5xl leading-[1.05] text-white tracking-tight md:text-7xl drop-shadow-[5px_5px_0px_#000]">
            CHOOSE YOUR
            <span className="block text-zinc-400">BUILDER LEVEL.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xs md:text-sm font-semibold leading-relaxed text-zinc-400 uppercase tracking-wide">
            Every plan includes our conversational visual builder, schema validation rules, respondent flow runner, database logs, and creator panel.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row max-w-md mx-auto">
            <Link
              className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_#000] hover:bg-white hover:scale-105 active:scale-95 transition-all"
              href="/dashboard"
            >
              <Zap className="size-4" />
              {primaryLabel}
            </Link>
            <Link
              className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-lg border-2 border-black bg-zinc-900/60 px-6 text-xs font-black uppercase tracking-wider text-zinc-350 shadow-[4px_4px_0px_#000] hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95"
              href="/explore"
            >
              <Sparkles className="size-4 text-zinc-400" />
              View showcases
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="text-center space-y-3">
          <p className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-500">
            Monochromatic ledger plans
          </p>
          <h2 className="font-flow-display text-4xl text-white tracking-tight md:text-5xl drop-shadow-[3px_3px_0px_#000]">
            Frictionless quota updates
          </h2>
        </div>

        <div className="mt-16 grid items-stretch gap-8 lg:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <article
              className={`group relative flex rounded-xl border-2 bg-zinc-900/40 p-8 shadow-[4px_4px_0px_#18181b] transition-all duration-300 hover:scale-102 hover:-rotate-1 ${
                plan.featured
                  ? "border-black bg-zinc-900 shadow-[8px_8px_0px_#000] scale-[1.02]"
                  : "border-black shadow-[6px_6px_0px_#18181b]"
              }`}
              key={plan.label}
            >
              <div className="flex w-full flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span
                        className={`rounded px-2.5 py-1 text-[9px] font-black uppercase tracking-wider border-2 border-black ${
                          plan.featured 
                            ? "bg-zinc-200 text-zinc-950 shadow-[2px_2px_0px_#000]" 
                            : "bg-zinc-950 text-zinc-450"
                        }`}
                      >
                        {plan.badge}
                      </span>
                      <h3 className="font-flow-display mt-5 text-2xl leading-none text-zinc-150">
                        {plan.label}
                      </h3>
                    </div>
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-zinc-950 border-2 border-black text-zinc-300 shadow-[2px_2px_0px_#000]">
                      {plan.featured ? <Sparkles className="size-5" /> : <Gift className="size-5" />}
                    </span>
                  </div>

                  <div className="mt-8 flex items-end gap-1.5">
                    <span className="text-5xl font-black text-white tracking-tight drop-shadow-[2px_2px_0px_#000]">
                      ${plan.price}
                    </span>
                    <span className="pb-1.5 text-xs font-bold text-zinc-550 uppercase tracking-wider">
                      {plan.cadence}
                    </span>
                  </div>

                  <p className="mt-5 min-h-16 text-xs leading-relaxed text-zinc-500 font-semibold uppercase tracking-wide">
                    {plan.copy}
                  </p>

                  <ul className="mt-7 space-y-3.5 border-t-2 border-black pt-6 text-xs text-zinc-405 font-bold uppercase tracking-wider">
                    {plan.perks.map((perk) => (
                      <li className="flex items-center gap-3" key={perk}>
                        <Check className="size-4 shrink-0 text-zinc-200" />
                        {perk}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  className={`mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 border-2 border-black ${
                    plan.featured
                      ? "bg-zinc-200 text-zinc-950 shadow-[3px_3px_0px_#000] group-hover:bg-white"
                      : "bg-zinc-950 text-zinc-350 shadow-[3px_3px_0px_#000] group-hover:bg-zinc-900"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="flow-kingdom-band py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="space-y-4">
              <p className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-500">
                Core Engines
              </p>
              <h2 className="font-flow-display text-4xl leading-tight text-white tracking-tight md:text-5xl drop-shadow-[3px_3px_0px_#000]">
                Built into every quota tier
              </h2>
              <p className="text-xs font-semibold uppercase leading-relaxed text-zinc-500 max-w-md tracking-wider">
                Full visual customization, conditional logic structures, and analytical compilation ledgers are enabled in this inspectable workspace sandbox.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {platformFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article
                    className="rounded-xl border-2 border-black bg-zinc-900/30 p-6 flex flex-col justify-between shadow-[4px_4px_0px_#18181b]"
                    key={feature.label}
                  >
                    <div>
                      <span className="grid size-10 place-items-center rounded-lg bg-zinc-950 border-2 border-black text-zinc-300 shadow-[2px_2px_0px_#000]">
                        <Icon className="size-5" />
                      </span>
                      <h3 className="text-sm font-black uppercase tracking-wider text-zinc-200 mt-5">
                        {feature.label}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-500 font-semibold uppercase tracking-wider">
                        {feature.copy}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20 lg:px-8">
        <div className="rounded-2xl border-3 border-black bg-zinc-900/40 px-6 py-14 text-center shadow-[8px_8px_0px_#18181b] md:px-12">
          <span className="inline-flex items-center gap-2 rounded border-2 border-black bg-zinc-950 px-4 py-1 text-xs font-black uppercase tracking-wider text-zinc-400">
            <Layers3 className="size-4 animate-pulse" />
            Sandbox Active
          </span>
          <h2 className="font-flow-display mt-6 text-4xl leading-tight text-white tracking-tight md:text-5xl drop-shadow-[3px_3px_0px_#000]">
            Deploy a quota sandbox
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-xs font-semibold leading-relaxed text-zinc-500 uppercase tracking-wider">
            All workspace sections are ready for judge inspection. Open the creator panel to test templates and compile layouts.
          </p>
          <Link
            className="mt-8 inline-flex h-12 min-w-64 items-center justify-center gap-2.5 rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_#000] hover:bg-white hover:-translate-y-0.5 transition-all duration-200"
            href="/dashboard"
          >
            Open strong panel
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
