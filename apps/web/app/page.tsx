"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  ExternalLink,
  GitBranch,
  Layers3,
  LockKeyhole,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { SiteNav } from "~/components/forms/site-nav";
import { trpc } from "~/trpc/client";

const fontHref =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap";

const arsenal = [
  {
    icon: Wand2,
    label: "Conversational builder",
    tag: "COMIC CORE",
    copy: "Forge surveys, waitlists, feedback forms, and onboarding flows with gorgeous interactive cartoon layouts.",
  },
  {
    icon: GitBranch,
    label: "Conditional branching",
    tag: "STARK LOGIC",
    copy: "Design custom paths based on user choices. Validate inputs instantly with Zod-backed schemas.",
  },
  {
    icon: BarChart3,
    label: "Real-time analytics",
    tag: "NOIR INSIGHTS",
    copy: "Track conversion trends, drop-offs, device analytics, and response tables in one clean dashboard.",
  },
];

const benefits = [
  {
    icon: Zap,
    label: "Rubber-Hose Conversion Rates",
    copy: "Interactive forms feel fast, responsive, and incredibly alive. Keep users engaged to capture high-completion rates.",
  },
  {
    icon: CircleDollarSign,
    label: "Stark Data Integrity",
    copy: "Strict type-checking ensures validation is executed instantly, cleaning inputs before database insertion.",
  },
];

const tiers = [
  {
    label: "Starter plan",
    price: "0",
    note: "free",
    cta: "Claim free",
    href: "/dashboard?plan=starter",
    perks: ["100 responses / month", "Basic share links", "Public gallery listing"],
  },
  {
    label: "Growth plan",
    price: "49",
    note: "/ month",
    cta: "Deploy growth",
    href: "/dashboard?plan=growth",
    featured: true,
    perks: ["10,000 responses / month", "Unlisted campaigns", "Advanced analytics"],
  },
  {
    label: "Enterprise plan",
    price: "199",
    note: "/ month",
    cta: "Upgrade now",
    href: "/dashboard?plan=enterprise",
    perks: ["Unlimited forms", "CSV exports", "Priority support"],
  },
];

function themeLabel(preset?: string | null) {
  if (!preset) return "custom preset";
  return preset.replace(/-/g, " ");
}

function SpidermanNoirHeroGraphic() {
  return (
    <div className="relative w-full max-w-lg h-[400px] flex items-center justify-center overflow-hidden rounded-2xl bg-zinc-950 border-3 border-black shadow-[8px_8px_0px_#18181b]">
      {/* Background neon cityscape represented in grayscale halftone */}
      <svg className="absolute inset-0 w-full h-full text-zinc-900" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="halftone-dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#27272a" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#halftone-dots)" />
        
        {/* Buildings silhouette with stark black-and-gray comic strokes */}
        <rect x="20" y="220" width="80" height="200" fill="#09090b" stroke="#27272a" strokeWidth="2" />
        <rect x="120" y="140" width="130" height="280" fill="#0f0f11" stroke="#3f3f46" strokeWidth="3" />
        <rect x="270" y="240" width="90" height="180" fill="#09090b" stroke="#27272a" strokeWidth="2" />
        <rect x="380" y="170" width="100" height="250" fill="#0f0f11" stroke="#3f3f46" strokeWidth="2" />
        
        {/* Grayscale Building windows */}
        <line x1="145" y1="180" x2="165" y2="180" stroke="#27272a" strokeWidth="3" strokeDasharray="4 4" />
        <line x1="145" y1="210" x2="165" y2="210" stroke="#27272a" strokeWidth="3" strokeDasharray="4 4" />
        <line x1="195" y1="180" x2="215" y2="180" stroke="#27272a" strokeWidth="3" strokeDasharray="4 4" />
        <line x1="195" y1="210" x2="215" y2="210" stroke="#27272a" strokeWidth="3" strokeDasharray="4 4" />
      </svg>
      
      {/* Spider-Web Swing Line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-[190px] bg-gradient-to-b from-zinc-700 via-zinc-200 to-zinc-400 origin-top animate-spiderman-swing">
        <svg className="absolute -left-[14px] top-[40px] w-[30px] h-[100px] text-zinc-650 overflow-visible">
          <path d="M 15 0 C 25 15, 25 35, 15 50" fill="none" stroke="currentColor" strokeWidth="1.2" className="animate-web-grow" />
          <path d="M 15 0 C 5 15, 5 35, 15 50" fill="none" stroke="currentColor" strokeWidth="1.2" className="animate-web-grow" />
          <path d="M 15 40 C 28 55, 28 75, 15 90" fill="none" stroke="currentColor" strokeWidth="1.2" className="animate-web-grow" />
          <path d="M 15 40 C 2 55, 2 75, 15 90" fill="none" stroke="currentColor" strokeWidth="1.2" className="animate-web-grow" />
        </svg>

        {/* Swinging Spider-Man Noir Silhouette with fedora & trench coat details */}
        <div className="absolute -bottom-[70px] -left-[30px] w-[60px] h-[80px] animate-float">
          <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]">
            {/* Grayscale suit structure */}
            <path d="M 50 15 C 38 15, 30 25, 30 35 C 30 45, 36 50, 40 55 C 32 65, 20 85, 20 95 C 20 105, 35 110, 42 98 C 45 92, 50 82, 50 82 C 50 82, 55 92, 58 98 C 65 110, 80 105, 80 95 C 80 85, 68 65, 60 55 C 64 50, 70 45, 70 35 C 70 25, 62 15, 50 15 Z" fill="#09090b" stroke="#52525b" strokeWidth="2.5" />
            <path d="M 40 55 C 45 65, 45 75, 42 98 C 44 95, 50 82, 50 82 C 50 82, 56 95, 58 98 C 55 75, 55 65, 60 55 C 50 62, 50 62, 40 55 Z" fill="#18181b" />
            
            {/* Hand-drawn trench coat collar outline */}
            <path d="M 33 45 L 43 55 L 50 48 L 57 55 L 67 45" stroke="#71717a" strokeWidth="2" />
            
            {/* Noir Fedora Hat */}
            <ellipse cx="50" cy="18" rx="22" ry="4" fill="#000" stroke="#52525b" strokeWidth="1.5" />
            <path d="M 36 18 C 36 10, 64 10, 64 18 Z" fill="#000" stroke="#52525b" strokeWidth="2" />
            
            {/* Stark White Eyes */}
            <path d="M 38 33 C 41 33, 44 36, 44 40 C 41 41, 38 39, 38 33 Z" fill="white" stroke="#000" strokeWidth="1.5" />
            <path d="M 62 33 C 59 33, 56 36, 56 40 C 59 41, 62 39, 62 33 Z" fill="white" stroke="#000" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
      
      {/* Grayscale hand-drawn style branding badges */}
      <div className="absolute top-12 left-10 p-3 rounded-xl border-2 border-black bg-zinc-900 text-[10px] font-black tracking-wider uppercase text-zinc-100 flex items-center gap-2 shadow-[3px_3px_0px_#000] animate-float">
        <Sparkles className="size-4 text-white animate-pulse" />
        NOIR ENGINE
      </div>
      
      <div className="absolute bottom-16 right-8 p-3 rounded-xl border-2 border-black bg-zinc-900 text-[10px] font-black tracking-wider uppercase text-zinc-100 flex items-center gap-2 shadow-[3px_3px_0px_#000] animate-float [animation-delay:2s]">
        <Check className="size-4 text-white" />
        TYPE SAFE
      </div>
    </div>
  );
}

function InteractiveFormShowcase() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [themePreset, setThemePreset] = useState("default");
  
  const totalSteps = 4;
  const progressPercent = Math.round((step / (totalSteps - 1)) * 100);

  return (
    <div className="flow-hero-frame relative mt-16 w-full max-w-2xl border-3 border-black bg-zinc-950 p-2 rounded-2xl shadow-[8px_8px_0px_#18181b]">
      <div className="bg-zinc-900 rounded-xl p-8 border-2 border-black min-h-[340px] flex flex-col justify-between">
        
        {/* Header/Progress bar */}
        <div>
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-3">
            <span>Conversational Flow</span>
            <span>{progressPercent}% Complete</span>
          </div>
          <div className="h-3 overflow-hidden rounded-lg border-2 border-black bg-zinc-950 p-0.5">
            <div 
              className="h-full bg-zinc-100 transition-all duration-400 ease-out rounded" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Content body */}
        <div className="my-8 flex-1 flex flex-col justify-center">
          {step === 0 && (
            <div className="space-y-4 animate-slide-up">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                  Step 1: Enter your Alias
                </span>
                <input 
                  type="text"
                  placeholder="e.g. Detective..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-3 w-full h-12 rounded-lg border-2 border-black bg-zinc-950 px-4 text-sm text-zinc-100 placeholder:text-zinc-650 focus:outline-none focus:border-zinc-300 transition shadow-[3px_3px_0px_#000]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim()) setStep(1);
                  }}
                />
              </label>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Type and press Enter or click Next.</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4 animate-slide-up">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                Step 2: Choose Creative Theme Preset
              </span>
              <div className="grid grid-cols-3 gap-3 mt-3">
                {["default", "spiderman", "cyberpunk"].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      setThemePreset(preset);
                      setStep(2);
                    }}
                    className={`p-3 rounded-lg border-2 border-black text-xs font-black uppercase tracking-wider transition hover:scale-105 active:scale-95 ${
                      themePreset === preset 
                        ? "bg-zinc-200 text-zinc-950 shadow-[3px_3px_0px_#000]"
                        : "bg-zinc-950 text-zinc-400 hover:border-zinc-300"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-slide-up">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                Step 3: What is your primary mission?
              </span>
              <div className="grid gap-2 mt-3">
                {["Increase Leads", "Collect Feedback", "Build waiting list"].map((spec) => (
                  <button
                    key={spec}
                    onClick={() => setStep(3)}
                    className="w-full text-left p-3 rounded-lg border-2 border-black bg-zinc-950 text-xs font-bold text-zinc-300 hover:bg-zinc-900 transition-all hover:scale-101 hover:shadow-[3px_3px_0px_#000]"
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4 py-4 animate-slide-up">
              <div className="inline-flex size-14 items-center justify-center rounded-full bg-zinc-200 text-zinc-950 border-2 border-black shadow-[3px_3px_0px_#000]">
                <Check className="size-7" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-wider text-zinc-100">Mission Success!</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Recruit <span className="text-zinc-200 font-bold">{name || "Detective"}</span> has been logged under the <span className="text-white font-black uppercase">{themePreset}</span> schema context.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center border-t-2 border-black pt-4">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:pointer-events-none transition"
          >
            Back
          </button>
          
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-white transition"
            >
              Next
              <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                setStep(0);
                setName("");
                setThemePreset("default");
              }}
              className="text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-white transition"
            >
              Reset Demo
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default function Home() {
  const { data: publicForms, isLoading } = trpc.forms.publicList.useQuery(undefined);

  useEffect(() => {
    if (document.querySelector(`link[href="${fontHref}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontHref;
    document.head.appendChild(link);
  }, []);

  return (
    <main className="theme-flowform-kingdom min-h-screen overflow-hidden text-zinc-250 selection:bg-zinc-200 selection:text-zinc-950">
      <SiteNav active="home" />

      <section className="flow-coc-hero-bg relative isolate min-h-[760px] overflow-hidden border-b-3 border-black px-5 pb-16 pt-20 text-center lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/40 to-zinc-950" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center">
          <p className="text-[10px] font-black tracking-[0.3em] uppercase text-zinc-950 bg-zinc-200 border-2 border-black px-5 py-1.5 rounded-lg shadow-[3px_3px_0px_#000] rotate-[-1deg]">
            STARK CONVERSATIONAL SURVEYS
          </p>
          <h1 className="font-flow-display mt-8 max-w-4xl text-5xl leading-[1.05] text-white tracking-tight md:text-8xl drop-shadow-[5px_5px_0px_#000]">
            BUILD BEAUTIFUL FORMS.
            <span className="block text-zinc-400">
              CAPTURE HIGHER CONVERSIONS.
            </span>
          </h1>
          <p className="mt-8 max-w-2xl text-xs md:text-sm font-semibold leading-relaxed text-zinc-400 uppercase tracking-wider">
            Create waitlists, feedback forms, and onboarding quests with cartoon-like precision. Share unlisted links, enforce validations, and log data into your command ledger.
          </p>

          <div className="mt-10 flex w-full flex-col items-center justify-center gap-4 sm:flex-row max-w-md">
            <Link
              className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_#000] hover:bg-white hover:scale-105 active:scale-95 active:shadow-[1px_1px_0px_#000] transition-all"
              href="/dashboard"
            >
              <Zap className="size-4" />
              Build your first form
              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border-2 border-black bg-zinc-900/60 px-6 text-xs font-black uppercase tracking-wider text-zinc-300 shadow-[4px_4px_0px_#000] hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95"
              href="/explore"
            >
              <Sparkles className="size-4 text-zinc-400" />
              Explore Showcases
            </Link>
          </div>

          <div className="grid w-full gap-12 mt-24 lg:grid-cols-2 lg:items-center text-left">
            <div className="flex flex-col items-center lg:items-start space-y-6">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl text-center lg:text-left drop-shadow-[3px_3px_0px_#000]">
                STARK NOIR COMIC. <br />
                <span className="text-zinc-450">POWERFUL COMPILATION.</span>
              </h2>
              <p className="text-xs font-semibold leading-relaxed text-zinc-500 text-center lg:text-left max-w-sm uppercase tracking-wider">
                Standard form builders generate rigid layouts. FlowForm advances questions step-by-step with hand-drawn cartoon precision and rubber-hose wiggles.
              </p>
              
              <div className="w-full max-w-sm p-4 rounded-xl border-2 border-black bg-zinc-900/30 flex items-start gap-4 shadow-[4px_4px_0px_#000]">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-zinc-200 text-zinc-950 border border-black shadow-[2px_2px_0px_#000]">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">Zod Handshakes</h4>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase mt-1">Every response undergoes severe validation parameters prior to database entries.</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center">
              <SpidermanNoirHeroGraphic />
            </div>
          </div>

          <InteractiveFormShowcase />
        </div>
      </section>

      <section className="border-y-3 border-black bg-zinc-950 py-16">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-500">
            Secure Monochromatic features
          </p>
          <div className="mt-8 flex justify-center gap-8 md:gap-12 flex-wrap">
            {[LockKeyhole, Layers3, ShieldCheck, ScrollText].map((Icon, index) => (
              <span
                className="grid size-12 place-items-center rounded-xl border-2 border-black bg-zinc-900/40 text-zinc-400 hover:text-white hover:shadow-[3px_3px_0px_#000] hover:scale-110 active:scale-95 transition-all"
                key={index}
              >
                <Icon className="size-5" />
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="quests" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-950 bg-zinc-200 border-2 border-black px-4 py-1 rounded shadow-[2px_2px_0px_#000]">
            Core Modules
          </span>
          <h2 className="font-flow-display text-4xl text-white tracking-tight md:text-5xl drop-shadow-[3px_3px_0px_#000]">
            Upgrade your command hub
          </h2>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            All elements necessary to deploy conversational visual pipelines.
          </p>
        </div>
        
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {arsenal.map((item) => {
            const Icon = item.icon;
            return (
              <article
                className="relative rounded-xl border-2 border-black bg-zinc-900/30 p-8 shadow-[4px_4px_0px_#18181b] hover:shadow-[6px_6px_0px_#000] hover:scale-102 transition-all"
                key={item.label}
              >
                <div className="grid size-12 place-items-center rounded-xl bg-zinc-900 border-2 border-black text-zinc-300 shadow-[2px_2px_0px_#000]">
                  <Icon className="size-5.5" />
                </div>
                <span className="absolute right-6 top-8 rounded bg-zinc-950 border border-black px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-400">
                  {item.tag}
                </span>
                <h3 className="text-base font-black uppercase tracking-wider text-zinc-200 mt-6">{item.label}</h3>
                <p className="mt-3 text-xs leading-relaxed text-zinc-500 font-semibold uppercase tracking-wide">{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section id="kingdom" className="border-y-3 border-black bg-zinc-900/20 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <article className="flow-gold-shine border-2 border-black p-8 rounded-xl" key={benefit.label}>
                  <div className="flex gap-5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-zinc-200 text-zinc-950 border border-black shadow-[2px_2px_0px_#000]">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wide text-zinc-200">
                        {benefit.label}
                      </h3>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-500 font-bold uppercase tracking-wider">
                        {benefit.copy}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-24">
            <div className="flex items-end justify-between gap-6 border-b-2 border-black pb-5">
              <div>
                <p className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-400">
                  Showcase index
                </p>
                <h3 className="font-flow-display mt-2 text-3xl text-white">Active ledger registry</h3>
              </div>
              <Link className="hidden text-xs font-black uppercase tracking-wider text-zinc-350 hover:text-white transition md:inline-flex items-center gap-1.5" href="/explore">
                View all ledgers
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {isLoading
                ? [0, 1, 2].map((item) => (
                    <div className="h-52 animate-pulse rounded-xl border-2 border-black bg-zinc-900/40" key={item} />
                  ))
                : (publicForms ?? []).slice(0, 3).map((form) => (
                    <article className="rounded-xl border-2 border-black bg-zinc-900/40 p-6 flex flex-col justify-between shadow-[4px_4px_0px_#000]" key={form.id}>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-950 border border-black px-2 py-0.5 rounded">
                          {themeLabel(form.theme?.preset)}
                        </span>
                        <h4 className="text-sm font-black uppercase tracking-wider text-zinc-200 mt-4 line-clamp-1">{form.title}</h4>
                        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-zinc-500 font-semibold uppercase tracking-wider min-h-12">
                          {form.description ?? "A beautiful conversational form built on FlowForm."}
                        </p>
                      </div>
                      <Link
                        className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-300 hover:text-white transition"
                        href={`/f/${form.slug}`}
                      >
                        Open live ledger
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </article>
                  ))}
            </div>
          </div>
        </div>
      </section>

      <section id="treasury" className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <span className="text-[10px] font-black tracking-[0.25em] uppercase text-zinc-950 bg-zinc-200 border-2 border-black px-4 py-1 rounded shadow-[2px_2px_0px_#000]">
            Transparent structures
          </span>
          <h2 className="font-flow-display text-4xl text-white tracking-tight md:text-5xl drop-shadow-[3px_3px_0px_#000]">
            Choose your quota level
          </h2>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            All plans support conversational formatting and instantaneous analytics.
          </p>
        </div>

        <div className="mt-16 grid items-stretch gap-8 lg:grid-cols-3 max-w-4xl mx-auto">
          {tiers.map((tier) => (
            <article
              className={`group relative rounded-xl border-2 bg-zinc-900/40 p-8 text-center flex flex-col justify-between transition-all duration-300 hover:scale-102 hover:-rotate-1 ${
                tier.featured
                  ? "border-black bg-zinc-900 shadow-[8px_8px_0px_#000] scale-[1.02]"
                  : "border-black shadow-[6px_6px_0px_#18181b]"
              }`}
              key={tier.label}
            >
              {tier.featured ? (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded bg-zinc-200 border-2 border-black px-4 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-950 shadow-[2px_2px_0px_#000]">
                  Most Popular
                </span>
              ) : null}
              
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400 bg-zinc-950 border border-black px-3 py-1 rounded">
                  {tier.label}
                </span>
                <div className="mt-8 flex items-end justify-center gap-1.5">
                  <span className="text-5xl font-black text-white tracking-tight drop-shadow-[2px_2px_0px_#000]">${tier.price}</span>
                  <span className="pb-1 text-xs font-bold text-zinc-500 uppercase tracking-wider">{tier.note}</span>
                </div>
                <ul className="mt-8 space-y-3.5 text-left text-xs text-zinc-405 font-bold uppercase tracking-wider border-t-2 border-black pt-6">
                  {tier.perks.map((perk) => (
                    <li className="flex items-center gap-3" key={perk}>
                      <Check className="size-4 shrink-0 text-zinc-200" />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button
                type="button"
                className={`mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg text-xs font-black uppercase tracking-wider transition-all duration-200 border-2 border-black ${
                  tier.featured
                    ? "bg-zinc-200 text-zinc-950 shadow-[3px_3px_0px_#000] group-hover:bg-white"
                    : "bg-zinc-950 text-zinc-300 shadow-[3px_3px_0px_#000] group-hover:bg-zinc-900"
                }`}
              >
                {tier.cta}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24 lg:px-8">
        <div className="flow-kingdom-band relative overflow-hidden rounded-2xl border-3 border-black px-6 py-20 text-center shadow-[8px_8px_0px_#18181b] md:px-16">
          <div className="pointer-events-none absolute -left-10 -top-10 size-28 rotate-12 border-2 border-zinc-700/10 rounded-xl" />
          <div className="pointer-events-none absolute -bottom-12 right-8 size-28 rotate-45 border-4 border-zinc-700/10 rounded-2xl" />
          <h2 className="font-flow-display text-4xl leading-tight text-white tracking-tight md:text-5xl drop-shadow-[3px_3px_0px_#000]">
            Ready to optimize your conversions?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Build waitlists, user surveys, and data pipelines in minutes. Get started with a campaign today.
          </p>
          <Link
            className="mt-8 inline-flex h-12 min-w-64 items-center justify-center rounded-lg bg-zinc-200 text-zinc-950 px-8 text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_#000] border-2 border-black hover:bg-white hover:scale-105 active:scale-95 active:shadow-[1px_1px_0px_#000] transition-all"
            href="/dashboard"
          >
            Start free demo
          </Link>
        </div>
      </section>

      <footer className="border-t-3 border-black bg-zinc-950 py-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 text-xs text-zinc-500 md:flex-row md:items-center md:justify-between lg:px-8">
          <div>
            <p className="font-flow-display text-lg text-white drop-shadow-[1px_1px_0px_#000]">FlowForm</p>
            <p className="mt-1 text-[11px] text-zinc-500 font-semibold uppercase tracking-wider normal-case">
              Visual conversational forms, secure responses, and instant analytics.
            </p>
          </div>
          <div className="flex flex-wrap gap-5 font-bold uppercase tracking-wider">
            <Link href="/pricing" className="hover:text-zinc-300">Pricing</Link>
            <Link href="/explore" className="hover:text-zinc-300">Explore</Link>
            <Link href="/api-docs" className="hover:text-zinc-300">API Docs</Link>
            <Link href="/dashboard" className="hover:text-zinc-300">Dashboard</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
