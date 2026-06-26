"use client";

import type { RouterOutputs } from "@repo/trpc/client";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { trpc } from "~/trpc/client";

type FormDetail = NonNullable<RouterOutputs["forms"]["publicBySlug"]>;
type Question = FormDetail["questions"][number];
type AnswerValue = string | number | boolean | string[] | null;

function isEmpty(value: AnswerValue | undefined) {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function SakuraPetals() {
  const [petals, setPetals] = useState<Array<{ id: number; left: string; delay: string; duration: string; size: string; rotate: string }>>([]);

  useEffect(() => {
    const generated = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: `${5 + Math.random() * 90}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${8 + Math.random() * 6}s`,
      size: `${10 + Math.random() * 12}px`,
      rotate: `${Math.random() * 360}deg`,
    }));
    setPetals(generated);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="animate-petal bg-rose-300/60"
          style={{
            left: petal.left,
            width: petal.size,
            height: petal.size,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
            borderRadius: "50% 0 50% 50%",
            transform: `rotate(${petal.rotate})`,
          }}
        />
      ))}
    </div>
  );
}

const THEMES = {
  default: {
    bodyClass: "font-sans min-h-screen px-5 py-6 flex flex-col justify-center relative",
    cardClass: "bg-white border border-neutral-200 rounded-2xl p-8 shadow-md max-w-2xl w-full mx-auto relative",
    inputClass: "h-12 border-neutral-300 bg-white text-lg text-neutral-950 focus:border-teal-600 focus:ring-teal-600 rounded-md",
    textareaClass: "min-h-36 border-neutral-300 bg-white text-lg text-neutral-950 focus:border-teal-600 focus:ring-teal-600 rounded-md",
    buttonClass: "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800",
    activeButtonClass: "border-teal-600 bg-teal-50 text-teal-900 font-semibold",
    navButtonClass: "bg-neutral-900 text-white hover:bg-neutral-800",
    decorations: null,
  },
  spiderman: {
    bodyClass: "theme-spiderman-halftone font-comic relative overflow-hidden select-none min-h-screen px-5 py-6 flex flex-col justify-center",
    cardClass: "border-4 border-red-600 bg-slate-950/95 rounded-2xl p-8 shadow-[0_0_30px_rgba(239,68,68,0.4)] max-w-2xl w-full mx-auto relative",
    inputClass: "h-12 border-4 border-blue-600 bg-slate-900 text-lg text-white font-comic focus:border-red-500 focus:ring-0 uppercase placeholder:text-slate-500 rounded-md",
    textareaClass: "min-h-36 border-4 border-blue-600 bg-slate-900 text-lg text-white font-comic focus:border-red-500 focus:ring-0 uppercase placeholder:text-slate-500 rounded-md",
    buttonClass: "border-4 border-blue-600 bg-slate-900 hover:bg-blue-900/50 hover:scale-[1.02] text-white font-comic transition-all duration-150 active:scale-95 uppercase text-left tracking-wider rounded-md",
    activeButtonClass: "border-4 border-red-500 bg-red-600/90 text-white font-bold scale-[1.03] shadow-[0_0_15px_rgba(239,68,68,0.6)]",
    navButtonClass: "bg-red-600 border-2 border-white hover:bg-red-700 text-white font-comic uppercase tracking-wider rounded-md",
    decorations: (
      <>
        {/* Top left web */}
        <svg className="absolute top-0 left-0 w-36 h-36 text-red-600/20 pointer-events-none z-0" viewBox="0 0 100 100" fill="currentColor">
          <path d="M0,0 Q50,50 100,0 M0,0 Q40,60 0,100" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M0,0 Q60,40 100,0 M0,0 Q30,70 0,100" fill="none" stroke="currentColor" strokeWidth="0.5" />
          <path d="M0,0 L100,100 M0,0 L70,100 M0,0 L100,70 M0,0 L50,100 M0,0 L100,50" stroke="currentColor" strokeWidth="0.8" />
          <path d="M20,0 Q20,20 0,20 M40,0 Q40,40 0,40 M60,0 Q60,60 0,60 M80,0 Q80,80 0,80" fill="none" stroke="currentColor" strokeWidth="0.8" />
        </svg>
        {/* Top right web */}
        <svg className="absolute top-0 right-0 w-36 h-36 text-red-600/20 pointer-events-none z-0" viewBox="0 0 100 100" fill="currentColor">
          <path d="M100,0 Q50,50 0,0 M100,0 Q60,60 100,100" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M100,0 L0,100 M100,0 L30,100 M100,0 L0,70 M100,0 L50,100 M100,0 L0,50" stroke="currentColor" strokeWidth="0.8" />
          <path d="M80,0 Q80,20 100,20 M60,0 Q60,40 100,40 M40,0 Q40,60 100,60 M20,0 Q20,80 100,80" fill="none" stroke="currentColor" strokeWidth="0.8" />
        </svg>
        {/* Large Spider outline background */}
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] text-red-500/[0.04] pointer-events-none z-0" viewBox="0 0 100 100" fill="currentColor">
          <path d="M50,30 C48,25 45,28 45,33 C45,38 48,43 50,45 C52,43 55,38 55,33 C55,28 52,25 50,30 Z" />
          <path d="M50,45 C46,45 42,50 42,60 C42,70 46,75 50,75 C54,75 58,70 58,60 C58,50 54,45 50,45 Z" />
          <circle cx="50" cy="24" r="4" />
          <path d="M46,33 Q30,15 15,25 Q25,35 44,38" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M45,46 Q20,30 10,48 Q22,50 43,50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M45,55 Q18,52 8,72 Q20,68 43,60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M46,65 Q22,78 12,95 Q25,85 45,72" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M54,33 Q70,15 85,25 Q75,35 56,38" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M55,46 Q80,30 90,48 Q78,50 57,50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M55,55 Q82,52 92,72 Q80,68 57,60" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M54,65 Q78,78 88,95 Q75,85 55,72" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </>
    ),
  },
  batman: {
    bodyClass: "theme-batman-vignette font-gothic relative overflow-hidden select-none min-h-screen px-5 py-6 flex flex-col justify-center",
    cardClass: "border border-yellow-500/20 bg-neutral-950/90 rounded-none p-10 shadow-[0_0_40px_rgba(0,0,0,0.9)] max-w-2xl w-full mx-auto relative before:content-[''] before:absolute before:inset-1.5 before:border before:border-yellow-500/5 before:pointer-events-none",
    inputClass: "h-12 border border-neutral-800 bg-neutral-900/80 text-lg text-white font-sans focus:border-yellow-500 focus:ring-0 placeholder:text-neutral-600 rounded-none",
    textareaClass: "min-h-36 border border-neutral-800 bg-neutral-900/80 text-lg text-white font-sans focus:border-yellow-500 focus:ring-0 placeholder:text-neutral-600 rounded-none",
    buttonClass: "border border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-yellow-500/60 hover:text-white transition-all duration-300 rounded-none text-left font-sans tracking-wide",
    activeButtonClass: "border-yellow-500 bg-yellow-500/10 text-yellow-500 font-semibold shadow-[0_0_15px_rgba(234,179,8,0.15)]",
    navButtonClass: "bg-neutral-900 border border-yellow-500/30 text-yellow-500 hover:bg-neutral-800 hover:border-yellow-500 rounded-none uppercase tracking-widest font-sans",
    decorations: (
      <>
        {/* Large Bat outline background */}
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[300px] text-yellow-500/[0.02] pointer-events-none z-0" viewBox="0 0 100 40" fill="currentColor">
          <path d="M 50 12 C 48 12, 47 6, 45 6 C 42 12, 35 12, 20 6 C 15 15, 10 25, 0 25 C 15 28, 30 35, 45 35 C 48 33, 49 33, 50 35 C 51 33, 52 33, 55 35 C 70 35, 85 28, 100 25 C 90 25, 85 15, 80 6 C 65 12, 58 12, 55 6 C 53 6, 52 12, 50 12 Z" />
        </svg>
        {/* Gothic corners */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-yellow-500/20 pointer-events-none" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-yellow-500/20 pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-yellow-500/20 pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-yellow-500/20 pointer-events-none" />
      </>
    ),
  },
  cyberpunk: {
    bodyClass: "theme-cyberpunk-grid font-cyber relative overflow-hidden min-h-screen px-5 py-6 flex flex-col justify-center",
    cardClass: "border-2 border-cyan-400 bg-black/90 p-8 shadow-[0_0_20px_rgba(6,182,212,0.3)] max-w-2xl w-full mx-auto relative before:content-[''] before:absolute before:top-0 before:right-0 before:w-3 before:h-3 before:bg-cyan-400 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-3 before:pointer-events-none after:pointer-events-none after:h-3 after:bg-cyan-400 rounded-none",
    inputClass: "h-12 border-2 border-cyan-500/50 bg-neutral-900 text-lg text-cyan-300 font-mono focus:border-yellow-400 focus:ring-0 placeholder:text-neutral-700 rounded-none uppercase",
    textareaClass: "min-h-36 border-2 border-cyan-500/50 bg-neutral-900 text-lg text-cyan-300 font-mono focus:border-yellow-400 focus:ring-0 placeholder:text-neutral-700 rounded-none uppercase",
    buttonClass: "border border-cyan-500/40 bg-neutral-950 text-cyan-400 hover:border-yellow-400 hover:text-yellow-400 hover:bg-neutral-900 transition-all duration-200 rounded-none text-left tracking-widest font-mono text-sm",
    activeButtonClass: "border-yellow-400 bg-yellow-400/10 text-yellow-400 font-semibold shadow-[0_0_15px_rgba(250,204,21,0.25)]",
    navButtonClass: "bg-neutral-950 border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-900/20 rounded-none uppercase tracking-widest font-mono text-xs",
    decorations: (
      <>
        {/* Moving scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0),rgba(255,255,255,0)_50%,rgba(0,240,255,0.03)_50%,rgba(0,240,255,0.03))] bg-[size:100%_4px] pointer-events-none z-10" />
        {/* Glow vignette */}
        <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,240,255,0.08)] pointer-events-none" />
        {/* Cyber labels */}
        <div className="absolute top-3 left-4 text-[9px] text-cyan-500/40 font-mono select-none tracking-widest pointer-events-none">
          SYSTEM: RUNNING // DB_SECURE // AUTH_OK
        </div>
        <div className="absolute top-3 right-4 text-[9px] text-cyan-500/40 font-mono select-none tracking-widest pointer-events-none">
          SECURE_NODE_9X9
        </div>
      </>
    ),
  },
  sakura: {
    bodyClass: "theme-sakura-bg font-sakura relative overflow-hidden min-h-screen px-5 py-6 flex flex-col justify-center",
    cardClass: "bg-white/75 backdrop-blur-md border border-rose-200/60 rounded-3xl p-10 shadow-[0_12px_40px_rgba(244,63,94,0.1)] max-w-2xl w-full mx-auto relative",
    inputClass: "h-12 border-rose-200 bg-white/90 text-lg text-rose-900 focus:border-rose-400 focus:ring-0 placeholder:text-rose-300 rounded-xl font-sans",
    textareaClass: "min-h-36 border-rose-200 bg-white/90 text-lg text-rose-900 focus:border-rose-400 focus:ring-0 placeholder:text-rose-300 rounded-xl font-sans",
    buttonClass: "border border-rose-200 bg-white/70 hover:bg-rose-50 text-rose-800 transition-all duration-300 rounded-2xl text-left font-sans shadow-sm",
    activeButtonClass: "border-rose-400 bg-rose-100 text-rose-900 font-semibold shadow-[0_4px_12px_rgba(244,63,94,0.12)]",
    navButtonClass: "bg-rose-500 hover:bg-rose-600 text-white rounded-full font-sans tracking-wide",
    decorations: <SakuraPetals />,
  },
};

export function FormRunner({ slug }: { slug: string }) {
  const formQuery = trpc.forms.publicBySlug.useQuery({ slug });
  const submitMutation = trpc.responses.submit.useMutation();
  const [index, setIndex] = useState(-1); // Start at Welcome Screen (-1)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<"up" | "down">("up");
  const nextRef = useRef<() => Promise<void>>(null as any);

  useEffect(() => {
    setIndex(-1);
    setAnswers({});
    setError(null);
    setSubmittedId(null);
    setSlideDirection("up");
  }, [slug]);

  const form = formQuery.data;

  // Font loading side-effect
  useEffect(() => {
    if (!form?.theme?.preset) return;
    const preset = form.theme.preset;
    let fontUrl = "";
    if (preset === "spiderman") {
      fontUrl = "https://fonts.googleapis.com/css2?family=Bangers&family=Luckiest+Guy&display=swap";
    } else if (preset === "batman") {
      fontUrl = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Outfit:wght@300;400;600;700&display=swap";
    } else if (preset === "cyberpunk") {
      fontUrl = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Share+Tech+Mono&display=swap";
    } else if (preset === "sakura") {
      fontUrl = "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap";
    } else {
      fontUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap";
    }

    let linkEl = document.getElementById("theme-fonts") as HTMLLinkElement | null;
    if (!linkEl) {
      linkEl = document.createElement("link");
      linkEl.id = "theme-fonts";
      linkEl.rel = "stylesheet";
      document.head.appendChild(linkEl);
    }
    linkEl.href = fontUrl;
  }, [form?.theme?.preset]);

  const presetKey = useMemo(() => {
    if (!form?.theme?.preset) return "default";
    return (form.theme.preset in THEMES ? form.theme.preset : "default") as keyof typeof THEMES;
  }, [form?.theme?.preset]);

  const activeTheme = THEMES[presetKey];

  const question = form?.questions[index];
  const progress = useMemo(() => {
    if (!form?.questions.length) return 0;
    if (index === -1) return 0;
    return Math.round(((index + 1) / form.questions.length) * 100);
  }, [form?.questions.length, index]);

  function setAnswer(questionId: string, value: AnswerValue) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setError(null);
  }

  function validateCurrent() {
    if (index === -1) return true;
    if (!question) return false;
    const value = answers[question.id];
    if (question.required && isEmpty(value)) {
      setError("This question is required!");
      return false;
    }
    return true;
  }

  async function next() {
    if (!form || submitMutation.isPending) return;

    if (index === -1) {
      setSlideDirection("up");
      setIndex(0);
      return;
    }

    if (!validateCurrent()) return;

    if (index < form.questions.length - 1) {
      setSlideDirection("up");
      setIndex((current) => current + 1);
      return;
    }

    // Submit form
    try {
      const response = await submitMutation.mutateAsync({
        slug,
        answers: form.questions
          .filter((item) => !isEmpty(answers[item.id]))
          .map((item) => ({
            questionId: item.id,
            value: answers[item.id] ?? null,
          })),
        metadata: {
          source: "public",
        },
      });
      setSubmittedId(response.responseId);
    } catch (err: any) {
      console.error("Submission failed:", err);
      setError(err?.message || "An unexpected error occurred during submission. Please try again.");
    }
  }

  nextRef.current = next;

  function back() {
    if (submitMutation.isPending) return;
    if (index > 0) {
      setSlideDirection("down");
      setIndex((current) => current - 1);
    } else if (index === 0) {
      setSlideDirection("down");
      setIndex(-1);
    }
  }

  // Keyboard controls effect
  useEffect(() => {
    if (!form) return;

    if (index === -1) {
      const handleStart = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          setSlideDirection("up");
          setIndex(0);
        }
      };
      window.addEventListener("keydown", handleStart);
      return () => window.removeEventListener("keydown", handleStart);
    }

    const currentQuestion = form.questions[index];
    if (!currentQuestion) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (submitMutation.isPending) return;

      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") {
        if (e.key === "Enter") {
          e.preventDefault();
          void nextRef.current();
        }
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        void nextRef.current();
        return;
      }

      if (e.key === "Backspace") {
        e.preventDefault();
        back();
        return;
      }

      // Option selection shortcuts
      if (
        currentQuestion.type === "single_choice" ||
        currentQuestion.type === "dropdown" ||
        currentQuestion.type === "multiple_choice"
      ) {
        const optionIndex = e.key.toUpperCase().charCodeAt(0) - 65; // A = 0, B = 1, etc.
        if (optionIndex >= 0 && optionIndex < currentQuestion.options.length) {
          e.preventDefault();
          const option = currentQuestion.options[optionIndex];
          if (option) {
            if (currentQuestion.type === "multiple_choice") {
              const currentVal = Array.isArray(answers[currentQuestion.id])
                ? (answers[currentQuestion.id] as string[])
                : [];
              const active = currentVal.includes(option.value);
              const newVal = active
                ? currentVal.filter((v) => v !== option.value)
                : [...currentVal, option.value];
              setAnswer(currentQuestion.id, newVal);
            } else {
              setAnswer(currentQuestion.id, option.value);
              setTimeout(() => {
                void nextRef.current();
              }, 300);
            }
          }
        }
      } else if (currentQuestion.type === "yes_no") {
        if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          setAnswer(currentQuestion.id, true);
          setTimeout(() => {
            void nextRef.current();
          }, 300);
        } else if (e.key.toLowerCase() === "n") {
          e.preventDefault();
          setAnswer(currentQuestion.id, false);
          setTimeout(() => {
            void nextRef.current();
          }, 300);
        }
      } else if (currentQuestion.type === "rating") {
        const num = Number(e.key);
        if (num >= 1 && num <= 5) {
          e.preventDefault();
          setAnswer(currentQuestion.id, num);
          setTimeout(() => {
            void nextRef.current();
          }, 300);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, answers, form, submitMutation.isPending]);

  if (formQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-100 font-sans">
        <Loader2 className="mr-2 size-5 animate-spin text-teal-300" />
        Loading...
      </main>
    );
  }

  if (!form) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-neutral-100 font-sans">
        Form not available
      </main>
    );
  }

  if (submittedId) {
    return (
      <main
        className={`flex min-h-screen items-center justify-center px-5 relative ${activeTheme.bodyClass}`}
        style={{
          backgroundColor: form.theme.background,
          color: form.theme.text,
        }}
      >
        {activeTheme.decorations}
        <section className={`text-center max-w-xl w-full z-10 ${activeTheme.cardClass}`}>
          <div
            className="mx-auto flex size-16 items-center justify-center rounded-full mb-6 bg-teal-600 text-white animate-bounce"
            style={presetKey !== "default" ? { backgroundColor: form.theme.accent } : {}}
          >
            <Check className="size-8" />
          </div>

          {presetKey === "spiderman" ? (
            <>
              <h1 className="text-4xl font-bold text-red-500 uppercase tracking-wider mb-2">
                Mission Accomplished! 🕸️
              </h1>
              <p className="text-xl text-white opacity-95 mb-6 font-comic">
                Your response has been secured. Web-shooter active.
              </p>
            </>
          ) : presetKey === "batman" ? (
            <>
              <h1 className="text-3xl font-semibold text-yellow-500 uppercase tracking-widest mb-2">
                Response Secured 🦇
              </h1>
              <p className="text-lg text-neutral-300 opacity-90 mb-6 font-gothic">
                Thank you. Gotham remains safe.
              </p>
            </>
          ) : presetKey === "cyberpunk" ? (
            <>
              <h1 className="text-3xl font-mono text-cyan-400 animate-glitch uppercase tracking-widest mb-2 font-cyber">
                [SUBMISSION_COMPLETE] 🤖
              </h1>
              <p className="text-lg text-yellow-300 opacity-95 mb-6 font-mono font-cyber">
                DATA UPLOAD SUCCESSFUL. LOG_ID: {submittedId.slice(0, 8).toUpperCase()}
              </p>
            </>
          ) : presetKey === "sakura" ? (
            <>
              <h1 className="text-4xl text-rose-800 font-bold mb-2 font-sakura">
                Thank You So Much 🌸
              </h1>
              <p className="text-lg text-rose-950 opacity-90 mb-6 font-sakura">
                Your response has bloomed beautifully.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-semibold mb-2">
                Thank you!
              </h1>
              <p className="text-lg opacity-70 mb-6">
                Your response has been successfully submitted.
              </p>
            </>
          )}

          <p className="text-xs opacity-50 font-mono">
            Response ID: {submittedId}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main
      className={`${activeTheme.bodyClass}`}
      style={{
        backgroundColor: form.theme.background,
        color: form.theme.text,
      }}
    >
      {activeTheme.decorations}
      
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-3xl flex-col justify-between relative z-10">
        <div>
          {form.settings.showProgress ? (
            <div className={`h-2.5 overflow-hidden mb-6 w-full ${
              presetKey === "spiderman" ? "border-2 border-red-600 bg-slate-900 rounded-sm" :
              presetKey === "batman" ? "border border-yellow-500/20 bg-neutral-950 rounded-none" :
              presetKey === "cyberpunk" ? "border-2 border-cyan-400 bg-black rounded-none" :
              presetKey === "sakura" ? "bg-rose-100/60 rounded-full" :
              "bg-black/10 rounded-full"
            }`}>
              <div
                className={`h-full transition-all duration-300 ${
                  presetKey === "cyberpunk" ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" :
                  presetKey === "spiderman" ? "bg-red-500" :
                  presetKey === "batman" ? "bg-yellow-500" :
                  presetKey === "sakura" ? "bg-rose-400 rounded-full" :
                  "rounded-full"
                }`}
                style={presetKey === "default" ? { background: form.theme.accent, width: `${progress}%` } : { width: `${progress}%` }}
              />
            </div>
          ) : null}

          <section className="flex flex-1 items-center py-6">
            <div
              key={`${index}-${slideDirection}`}
              className={`w-full ${slideDirection === "up" ? "animate-slide-up" : "animate-slide-down"} ${activeTheme.cardClass}`}
            >
              {index === -1 ? (
                <div className="text-center py-8">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
                    {form.title}
                  </h1>
                  {form.description ? (
                    <p className="max-w-xl mx-auto text-lg opacity-85 mb-8">
                      {form.description}
                    </p>
                  ) : (
                    <p className="max-w-xl mx-auto text-lg opacity-60 mb-8">
                      Welcome! Please take a few moments to fill out this form.
                    </p>
                  )}

                  <div className="mt-8 flex flex-col items-center justify-center gap-4">
                    <Button
                      onClick={() => void next()}
                      className={`px-8 py-6 text-lg transition-transform hover:scale-105 active:scale-95 ${presetKey !== "default" ? activeTheme.navButtonClass : ""}`}
                      style={presetKey === "default" ? { background: form.theme.accent, color: "#ffffff" } : {}}
                    >
                      Start Form
                      <ArrowRight className="ml-2 size-5" />
                    </Button>
                    <p className="text-xs opacity-50 font-mono">
                      Press Enter ↵ to begin
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs opacity-60 mb-2 uppercase tracking-widest font-mono">
                    Question {index + 1} of {form.questions.length}
                  </p>
                  <h2 className="text-2xl md:text-3xl font-semibold leading-snug">
                    {question?.title}
                    {question?.required && <span className="text-red-500 ml-1 font-sans">*</span>}
                  </h2>
                  {question?.description && (
                    <p className="mt-2 text-sm md:text-base opacity-75">{question.description}</p>
                  )}

                  <div className="mt-8">
                    {question && (
                      <QuestionInput
                        answer={answers[question.id]}
                        accent={form.theme.accent}
                        question={question}
                        setAnswer={(value) => setAnswer(question.id, value)}
                        activeTheme={activeTheme}
                        presetKey={presetKey}
                        next={() => void nextRef.current()}
                      />
                    )}
                    {error && (
                      <p className="mt-3 text-sm text-red-500 font-semibold animate-pulse">
                        ⚠️ {error}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-black/10 py-5 mt-8 bg-transparent">
          <Button
            disabled={index === -1 || submitMutation.isPending}
            onClick={() => back()}
            variant="outline"
            className={presetKey !== "default" ? activeTheme.buttonClass : ""}
          >
            <ArrowLeft className="mr-1 size-4" />
            Back
          </Button>
          
          <div className="flex items-center gap-3">
            {presetKey !== "default" && index !== -1 && (
              <span className="text-xs opacity-50 font-mono hidden sm:inline">
                Press Enter ↵
              </span>
            )}
            <Button
              disabled={submitMutation.isPending}
              onClick={() => void nextRef.current()}
              className={presetKey !== "default" ? activeTheme.navButtonClass : ""}
              style={presetKey === "default" ? { background: form.theme.accent, color: "#ffffff" } : {}}
            >
              {submitMutation.isPending ? (
                <Loader2 className="animate-spin mr-1 size-4" />
              ) : (
                <ArrowRight className="mr-1 size-4" />
              )}
              {index === form.questions.length - 1 ? "Submit" : index === -1 ? "Start" : "Next"}
            </Button>
          </div>
        </footer>
      </div>
    </main>
  );
}

function QuestionInput({
  question,
  answer,
  accent,
  setAnswer,
  activeTheme,
  presetKey,
  next,
}: {
  question: Question;
  answer: AnswerValue | undefined;
  accent: string;
  setAnswer: (value: AnswerValue) => void;
  activeTheme: typeof THEMES[keyof typeof THEMES];
  presetKey: keyof typeof THEMES;
  next: () => void;
}) {
  function getOptionStyle(optionValue: string, isSelected: boolean) {
    if (presetKey === "default") {
      return {
        borderColor: isSelected ? accent : "rgba(0,0,0,0.14)",
        background: isSelected ? `${accent}1a` : "rgba(255,255,255,0.72)",
      };
    }
    const style: CSSProperties = {};
    if (isSelected) {
      style.borderColor = accent;
      style.backgroundColor = `${accent}22`;
    }
    return style;
  }

  if (question.type === "long_text") {
    return (
      <Textarea
        value={typeof answer === "string" ? answer : ""}
        onChange={(event) => setAnswer(event.target.value)}
        placeholder={question.placeholder ?? "Type your answer"}
        className={`min-h-36 ${activeTheme.textareaClass}`}
      />
    );
  }

  if (question.type === "number") {
    return (
      <Input
        value={typeof answer === "number" ? String(answer) : ""}
        onChange={(event) =>
          setAnswer(event.target.value === "" ? null : Number(event.target.value))
        }
        placeholder={question.placeholder ?? "0"}
        type="number"
        className={`h-12 ${activeTheme.inputClass}`}
      />
    );
  }

  if (question.type === "date") {
    return (
      <Input
        value={typeof answer === "string" ? answer : ""}
        onChange={(event) => setAnswer(event.target.value)}
        type="date"
        className={`h-12 ${activeTheme.inputClass}`}
      />
    );
  }

  if (question.type === "rating") {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((value) => {
          const isSelected = answer === value;
          return (
            <button
              className={`flex size-12 items-center justify-center rounded-md border text-lg font-semibold transition ${activeTheme.buttonClass} ${isSelected ? activeTheme.activeButtonClass : ""}`}
              key={value}
              onClick={() => {
                setAnswer(value);
                setTimeout(() => next(), 300);
              }}
              style={getOptionStyle(String(value), isSelected)}
              type="button"
            >
              {value}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "yes_no") {
    return (
      <div className="flex gap-3">
        {[true, false].map((value, idx) => {
          const isSelected = answer === value;
          const char = idx === 0 ? "Y" : "N";
          return (
            <button
              className={`px-6 py-4 border font-medium transition-all ${activeTheme.buttonClass} ${isSelected ? activeTheme.activeButtonClass : ""}`}
              key={String(value)}
              onClick={() => {
                setAnswer(value);
                setTimeout(() => next(), 300);
              }}
              style={getOptionStyle(String(value), isSelected)}
              type="button"
            >
              <span className="mr-2 font-bold opacity-60">[{char}]</span>
              {value ? "Yes" : "No"}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "single_choice" || question.type === "dropdown") {
    return (
      <div className="space-y-3">
        {question.options.map((option, idx) => {
          const isSelected = answer === option.value;
          const char = String.fromCharCode(65 + idx); // A, B, C...
          return (
            <button
              className={`flex w-full items-center justify-between gap-3 p-4 border text-left transition-all ${activeTheme.buttonClass} ${isSelected ? activeTheme.activeButtonClass : ""}`}
              key={option.id}
              onClick={() => {
                setAnswer(option.value);
                setTimeout(() => next(), 300);
              }}
              style={getOptionStyle(option.value, isSelected)}
              type="button"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center font-bold text-xs border rounded-md w-6 h-6 opacity-60 bg-black/10">
                  {char}
                </span>
                <span>{option.label}</span>
              </div>
              <div className="flex items-center justify-center">
                {isSelected && (
                  <Check className="size-4" style={{ color: accent }} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === "multiple_choice") {
    const values = Array.isArray(answer) ? answer : [];
    return (
      <div className="space-y-3">
        {question.options.map((option, idx) => {
          const active = values.includes(option.value);
          const char = String.fromCharCode(65 + idx); // A, B, C...
          return (
            <button
              className={`flex w-full items-center justify-between gap-3 p-4 border text-left transition-all ${activeTheme.buttonClass} ${active ? activeTheme.activeButtonClass : ""}`}
              key={option.id}
              onClick={() =>
                setAnswer(
                  active
                    ? values.filter((value) => value !== option.value)
                    : [...values, option.value],
                )
              }
              style={getOptionStyle(option.value, active)}
              type="button"
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center font-bold text-xs border rounded-md w-6 h-6 opacity-60 bg-black/10">
                  {char}
                </span>
                <span>{option.label}</span>
              </div>
              <div className="flex items-center justify-center">
                <span
                  className="flex size-4 items-center justify-center rounded border"
                  style={{ borderColor: active ? accent : "rgba(0,0,0,0.3)" }}
                >
                  {active ? <Check className="size-3" strokeWidth={3} /> : null}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Input
      value={typeof answer === "string" ? answer : ""}
      onChange={(event) => setAnswer(event.target.value)}
      placeholder={question.placeholder ?? "Type your answer"}
      type={question.type === "email" ? "email" : "text"}
      className={`h-12 ${activeTheme.inputClass}`}
    />
  );
}
