"use client";

import Link from "next/link";
import {
  ArrowRight,
  Crown,
  ExternalLink,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { SiteNav } from "~/components/forms/site-nav";
import { trpc } from "~/trpc/client";

const fontHref =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap";

function presetTone(preset?: string | null) {
  switch (preset) {
    case "spiderman":
      return "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000]";
    case "batman":
      return "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000]";
    case "cyberpunk":
      return "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000]";
    case "sakura":
      return "border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 shadow-[4px_4px_0px_#000] hover:shadow-[6px_6px_0px_#000]";
    default:
      return "border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 shadow-[4px_4px_0px_#18181b] hover:shadow-[6px_6px_0px_#000]";
  }
}

function themeLabel(preset?: string | null) {
  if (!preset) return "custom preset";
  return preset.replace(/-/g, " ");
}

export default function ExplorePage() {
  const formsQuery = trpc.forms.publicList.useQuery(undefined);
  const forms = formsQuery.data ?? [];

  useEffect(() => {
    if (document.querySelector(`link[href="${fontHref}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontHref;
    document.head.appendChild(link);
  }, []);

  return (
    <main className="theme-flowform-kingdom min-h-screen overflow-hidden text-zinc-200 selection:bg-zinc-200 selection:text-zinc-950">
      <SiteNav active="explore" />

      <section className="flow-coc-hero-bg relative isolate border-b-3 border-black px-5 py-20 text-center lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/40 to-zinc-950" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <span className="inline-flex items-center gap-2 rounded border-2 border-black bg-zinc-200 text-zinc-950 px-4 py-1 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#000]">
            <Crown className="size-4" />
            Public Showcase
          </span>
          <h1 className="font-flow-display mt-7 text-5xl leading-[1.05] text-white tracking-tight md:text-7xl drop-shadow-[5px_5px_0px_#000]">
            EXPLORE LIVE
            <span className="block text-zinc-400">LEDGER FORMS.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xs md:text-sm font-semibold leading-relaxed text-zinc-400 uppercase tracking-wide">
            Browse active public forms built by creators, inspect their theme presets, and test respondent flows. Unlisted campaigns remain secure and accessible only via direct link.
          </p>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,_1fr)]">
          <aside className="h-fit rounded-xl border-2 border-black bg-zinc-900/40 p-6 shadow-[5px_5px_0px_#18181b]">
            <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 border-2 border-black text-zinc-200 shadow-[2px_2px_0px_#000]">
              <Search className="size-5" />
            </div>
            <p className="text-[9px] font-black tracking-wider uppercase text-zinc-550 mt-5">
              Ledger Registry
            </p>
            <h2 className="font-flow-display mt-2 text-2xl leading-none text-zinc-150">
              Active index
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500 font-semibold uppercase tracking-wider">
              Published public ledgers with customizable inputs, interactive templates, and schema validation.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg border-2 border-black bg-zinc-950 p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                  Published
                </p>
                <p className="font-flow-display mt-1.5 text-3xl leading-none text-zinc-200">
                  {forms.length}
                </p>
              </div>
              <div className="rounded-lg border-2 border-black bg-zinc-950 p-4">
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                  Visibility
                </p>
                <p className="font-flow-display mt-1.5 text-xl leading-none text-zinc-400">
                  Public
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-lg border-2 border-black bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-500 font-semibold uppercase tracking-wider flex items-start gap-3">
              <ShieldCheck className="size-5 text-zinc-300 shrink-0" />
              <span>Only forms set to public appear in this list. Unlisted forms are link-only.</span>
            </div>
          </aside>

          <section>
            {formsQuery.isLoading ? (
              <div className="flex min-h-80 items-center justify-center rounded-xl border-2 border-black bg-zinc-900/40 text-xs font-bold uppercase tracking-wider text-zinc-400 shadow-sm">
                <Loader2 className="mr-2.5 size-5 animate-spin text-zinc-300" />
                Loading templates...
              </div>
            ) : forms.length ? (
              <div className="grid gap-5 md:grid-cols-2">
                {forms.map((form) => {
                  const tone = presetTone(form.theme.preset);
                  return (
                    <article
                      className={`flex min-h-[250px] flex-col justify-between rounded-xl border-2 p-6 transition-all duration-300 ${tone}`}
                      key={form.id}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <Badge
                            variant="outline"
                            className="rounded border border-black bg-zinc-950 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-300"
                          >
                            {themeLabel(form.theme.preset)}
                          </Badge>
                          <Sparkles className="size-4.5 text-zinc-300" />
                        </div>
                        <h2 className="text-base font-black uppercase tracking-wider text-zinc-200 mt-5 leading-tight">
                          {form.title}
                        </h2>
                        <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-zinc-550 font-semibold uppercase tracking-wider">
                          {form.description ?? "Interactive conversational form built on FlowForm."}
                        </p>
                      </div>
                      <div className="mt-6 flex flex-col gap-3 border-t-2 border-black pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <code className="truncate rounded border border-black bg-zinc-950 px-3 py-1.5 text-xs text-zinc-400">
                          /f/{form.slug}
                        </code>
                        <Button
                          asChild
                          className="rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black font-black uppercase tracking-wider text-xs shadow-[3px_3px_0px_#000] hover:bg-white h-9 px-4 transition-all hover:scale-105 active:scale-95"
                        >
                          <Link href={`/f/${form.slug}`}>
                            <ExternalLink className="size-3.5 mr-1" />
                            Open
                          </Link>
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-black bg-zinc-900/20 p-12 text-center shadow-sm">
                <p className="font-flow-display text-2xl text-zinc-300">No public forms yet</p>
                <p className="mx-auto mt-2 max-w-sm text-xs font-semibold text-zinc-500 uppercase tracking-wider leading-relaxed">
                  Public showcases will appear here as soon as templates are created and marked as public visibility.
                </p>
                <Button
                  asChild
                  className="mt-6 rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black font-black uppercase tracking-wider text-xs shadow-[3px_3px_0px_#000] hover:bg-white px-5 py-2.5 h-10 transition-all hover:scale-105 active:scale-95"
                >
                  <Link href="/dashboard">
                    Create form
                    <ArrowRight className="size-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
