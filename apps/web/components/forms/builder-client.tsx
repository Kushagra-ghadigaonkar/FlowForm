"use client";

import type { RouterOutputs } from "@repo/trpc/client";
import Link from "next/link";
import {
  AlignLeft,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  Check,
  CircleDot,
  Copy,
  Crown,
  Eye,
  Gem,
  Hammer,
  Hash,
  List,
  Loader2,
  Mail,
  Plus,
  Save,
  ScrollText,
  Send,
  Settings,
  Shield,
  SquareCheck,
  Star,
  Trash2,
  Type,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { trpc } from "~/trpc/client";

type FormDetail = NonNullable<RouterOutputs["forms"]["byId"]>;
type QuestionType = FormDetail["questions"][number]["type"];

type DraftOption = {
  id?: string;
  label: string;
  value: string;
  position: number;
};

type DraftValidation = {
  minLength: number | null;
  maxLength: number | null;
  min: number | null;
  max: number | null;
  pattern: string | null;
};

type DraftQuestion = {
  clientId: string;
  id?: string;
  type: QuestionType;
  title: string;
  description: string | null;
  required: boolean;
  position: number;
  placeholder: string | null;
  helpText: string | null;
  validation: DraftValidation;
  options: DraftOption[];
};

const questionTypes: Array<{ value: QuestionType; label: string }> = [
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "single_choice", label: "Single choice" },
  { value: "multiple_choice", label: "Multiple choice" },
  { value: "dropdown", label: "Dropdown" },
  { value: "date", label: "Date" },
  { value: "rating", label: "Rating" },
  { value: "yes_no", label: "Yes or no" },
];

const optionTypes: QuestionType[] = ["single_choice", "multiple_choice", "dropdown"];
const builderFontHref =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700;800;900&display=swap";

const fieldPalette: Array<{
  icon: typeof Type;
  label: string;
  value: QuestionType;
}> = [
  { value: "short_text", label: "Short Text", icon: Type },
  { value: "long_text", label: "Long Text", icon: AlignLeft },
  { value: "email", label: "Email", icon: Mail },
  { value: "number", label: "Number", icon: Hash },
  { value: "single_choice", label: "Single Select", icon: CircleDot },
  { value: "multiple_choice", label: "Multiple Select", icon: SquareCheck },
  { value: "date", label: "Date", icon: CalendarDays },
  { value: "dropdown", label: "Dropdown", icon: List },
  { value: "rating", label: "Rating", icon: Star },
  { value: "yes_no", label: "Yes / No", icon: Check },
];

function iconForType(type: QuestionType) {
  return fieldPalette.find((item) => item.value === type)?.icon ?? Type;
}

function makeClientId() {
  return globalThis.crypto?.randomUUID?.() ?? `draft-${Date.now()}-${Math.random()}`;
}

function labelForType(type: QuestionType) {
  return questionTypes.find((item) => item.value === type)?.label ?? type;
}

function isOptionType(type: QuestionType) {
  return optionTypes.includes(type);
}

function emptyValidation(): DraftValidation {
  return {
    minLength: null,
    maxLength: null,
    min: null,
    max: null,
    pattern: null,
  };
}

function normalizeValidation(value?: Partial<DraftValidation> | null): DraftValidation {
  return {
    minLength: value?.minLength ?? null,
    maxLength: value?.maxLength ?? null,
    min: value?.min ?? null,
    max: value?.max ?? null,
    pattern: value?.pattern ?? null,
  };
}

function parseNumberField(value: string, integer = false): number | null {
  if (!value.trim()) return null;
  const parsed = integer ? Number.parseInt(value, 10) : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function slugValue(label: string) {
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || "option"
  );
}

function fromForm(form: FormDetail): DraftQuestion[] {
  return form.questions.map((question) => ({
    clientId: question.id,
    id: question.id,
    type: question.type,
    title: question.title,
    description: question.description,
    required: question.required,
    position: question.position,
    placeholder: question.placeholder,
    helpText: question.helpText,
    validation: normalizeValidation(question.validation),
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
      value: option.value,
      position: option.position,
    })),
  }));
}

function newQuestion(type: QuestionType = "short_text", position = 0): DraftQuestion {
  const options = isOptionType(type)
    ? [
        { label: "Option 1", value: "option-1", position: 0 },
        { label: "Option 2", value: "option-2", position: 1 },
      ]
    : [];

  return {
    clientId: makeClientId(),
    type,
    title: `${labelForType(type)} question`,
    description: null,
    required: false,
    position,
    placeholder: null,
    helpText: null,
    validation: emptyValidation(),
    options,
  };
}

export function BuilderClient({ formId }: { formId: string }) {
  const utils = trpc.useUtils();
  const formQuery = trpc.forms.byId.useQuery({ formId });
  const saveMutation = trpc.forms.saveBuilder.useMutation();
  const publishMutation = trpc.forms.publish.useMutation();
  const unpublishMutation = trpc.forms.unpublish.useMutation();
  const [copiedLink, setCopiedLink] = useState(false);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [deployShareUrl, setDeployShareUrl] = useState("");
  const [deployCopied, setDeployCopied] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [hydratedFormId, setHydratedFormId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [visibility, setVisibility] = useState<"public" | "unlisted">("unlisted");
  const [theme, setTheme] = useState<{
    background: string;
    text: string;
    accent: string;
    preset?: string;
  }>({
    background: "#fafafa",
    text: "#18181b",
    accent: "#0f766e",
    preset: "default",
  });

  useEffect(() => {
    if (document.querySelector(`link[href="${builderFontHref}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = builderFontHref;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (!formQuery.data || hydratedFormId === formQuery.data.id) return;

    const loadedQuestions = fromForm(formQuery.data);
    setTitle(formQuery.data.title);
    setDescription(formQuery.data.description ?? "");
    setQuestions(loadedQuestions.length ? loadedQuestions : [newQuestion("short_text", 0)]);
    setSelectedId(loadedQuestions[0]?.clientId ?? null);
    setStatus(formQuery.data.status);
    setVisibility(formQuery.data.visibility);
    setHydratedFormId(formQuery.data.id);
    if (formQuery.data.theme) {
      setTheme({
        background: formQuery.data.theme.background,
        text: formQuery.data.theme.text,
        accent: formQuery.data.theme.accent,
        preset: formQuery.data.theme.preset ?? "default",
      });
    }
  }, [formQuery.data, hydratedFormId]);

  const selectedQuestion = useMemo(
    () => questions.find((question) => question.clientId === selectedId) ?? questions[0],
    [questions, selectedId],
  );

  function applySavedForm(form: FormDetail) {
    const nextQuestions = fromForm(form);
    setTitle(form.title);
    setDescription(form.description ?? "");
    setQuestions(nextQuestions);
    setSelectedId((current) => {
      if (current && nextQuestions.some((question) => question.clientId === current))
        return current;
      return nextQuestions[0]?.clientId ?? null;
    });
    setStatus(form.status);
    setVisibility(form.visibility);
    setHydratedFormId(form.id);
    if (form.theme) {
      setTheme({
        background: form.theme.background,
        text: form.theme.text,
        accent: form.theme.accent,
        preset: form.theme.preset ?? "default",
      });
    }
  }

  function updateQuestion(clientId: string, patch: Partial<DraftQuestion>) {
    setDeployError(null);
    setQuestions((current) =>
      current.map((question) => {
        if (question.clientId !== clientId) return question;
        const next = { ...question, ...patch };
        if (patch.type && isOptionType(patch.type) && next.options.length === 0) {
          next.options = [
            { label: "Option 1", value: "option-1", position: 0 },
            { label: "Option 2", value: "option-2", position: 1 },
          ];
        }
        return next;
      }),
    );
  }

  function updateValidation(clientId: string, patch: Partial<DraftValidation>) {
    setQuestions((current) =>
      current.map((question) =>
        question.clientId === clientId
          ? { ...question, validation: { ...question.validation, ...patch } }
          : question,
      ),
    );
  }

  function addQuestion(type: QuestionType = "short_text") {
    setDeployError(null);
    const question = newQuestion(type, questions.length);
    setQuestions((current) => [...current, question]);
    setSelectedId(question.clientId);
  }

  function removeQuestion(clientId: string) {
    setDeployError(null);
    setQuestions((current) => {
      const next = current.filter((question) => question.clientId !== clientId);
      if (!next.length) {
        const replacement = newQuestion("short_text", 0);
        setSelectedId(replacement.clientId);
        return [replacement];
      }
      setSelectedId(next[0]?.clientId ?? null);
      return next;
    });
  }

  function moveQuestion(clientId: string, direction: -1 | 1) {
    setQuestions((current) => {
      const index = current.findIndex((question) => question.clientId === clientId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const [question] = next.splice(index, 1);
      if (!question) return current;
      next.splice(nextIndex, 0, question);
      return next.map((item, position) => ({ ...item, position }));
    });
  }

  function addOption(clientId: string) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.clientId !== clientId) return question;
        const nextNumber = question.options.length + 1;
        return {
          ...question,
          options: [
            ...question.options,
            {
              label: `Option ${nextNumber}`,
              value: `option-${nextNumber}`,
              position: question.options.length,
            },
          ],
        };
      }),
    );
  }

  function updateOption(clientId: string, index: number, label: string) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.clientId !== clientId) return question;
        return {
          ...question,
          options: question.options.map((option, optionIndex) =>
            optionIndex === index
              ? {
                  ...option,
                  label,
                  value: slugValue(label),
                }
              : option,
          ),
        };
      }),
    );
  }

  function removeOption(clientId: string, index: number) {
    setQuestions((current) =>
      current.map((question) => {
        if (question.clientId !== clientId) return question;
        return {
          ...question,
          options: question.options
            .filter((_, optionIndex) => optionIndex !== index)
            .map((option, position) => ({ ...option, position })),
        };
      }),
    );
  }

  async function saveBuilder() {
    const saved = await saveMutation.mutateAsync({
      formId,
      title,
      description: description.trim() || null,
      visibility,
      theme,
      questions: questions.map((question, index) => ({
        id: question.id,
        type: question.type,
        title: question.title,
        description: question.description?.trim() || null,
        required: question.required,
        position: index,
        placeholder: question.placeholder?.trim() || null,
        helpText: question.helpText?.trim() || null,
        validation: question.validation,
        options: isOptionType(question.type)
          ? question.options.map((option, optionIndex) => ({
              id: option.id,
              label: option.label,
              value: option.value || slugValue(option.label),
              position: optionIndex,
            }))
          : [],
      })),
    });

    applySavedForm(saved);
    await utils.forms.byId.invalidate({ formId });
    await utils.forms.list.invalidate();
    return saved;
  }

  function getShareUrl(slugValue: string) {
    const origin = typeof window === "undefined" ? "" : window.location.origin;
    return `${origin}/f/${slugValue}`;
  }

  async function copyShareUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch {
      return false;
    }
  }

  async function publish() {
    await saveBuilder();
    const published = await publishMutation.mutateAsync({ formId });
    setStatus(published.status);
    setDeployShareUrl(getShareUrl(published.slug));
    setDeployCopied(false);
    setDeployError(null);
    setDeployDialogOpen(true);
    await utils.forms.byId.invalidate({ formId });
    await utils.forms.list.invalidate();
  }

  function getDeployValidationError() {
    if (!title.trim()) return "Add a form title before deploying.";
    const missingTitleIndex = questions.findIndex((question) => !question.title.trim());
    if (missingTitleIndex >= 0) return `Question ${missingTitleIndex + 1} needs a title.`;
    return null;
  }

  function getMutationErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;
    return "Deploy failed. Please check your form and try again.";
  }

  async function deployForm() {
    const validationError = getDeployValidationError();
    if (validationError) {
      setDeployError(validationError);
      return;
    }

    try {
      setDeployError(null);
      if (status === "published") {
        const saved = await saveBuilder();
        setDeployShareUrl(getShareUrl(saved.slug));
        setDeployCopied(false);
        setDeployDialogOpen(true);
        return;
      }

      await publish();
    } catch (error) {
      setDeployError(getMutationErrorMessage(error));
    }
  }

  async function unpublish() {
    const draft = await unpublishMutation.mutateAsync({ formId });
    setStatus(draft.status);
    await utils.forms.byId.invalidate({ formId });
    await utils.forms.list.invalidate();
  }

  const isWorking =
    saveMutation.isPending || publishMutation.isPending || unpublishMutation.isPending;

  if (formQuery.isLoading) {
    return (
      <main className="theme-flowform-kingdom flex min-h-screen items-center justify-center text-zinc-200">
        <div className="flex items-center rounded-xl border-2 border-black bg-zinc-950 px-6 py-5 shadow-[5px_5px_0px_#000]">
          <Loader2 className="mr-3 size-5 animate-spin text-zinc-300" />
          <span className="font-flow-display text-lg tracking-wide text-zinc-100">Loading Builder...</span>
        </div>
      </main>
    );
  }

  if (formQuery.isError) {
    return (
      <main className="theme-flowform-kingdom flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center text-zinc-200">
        <p className="font-flow-display text-3xl text-white">Sign in to open this builder</p>
        <Button asChild className="rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_#000] hover:bg-white active:scale-95 transition-all hover:scale-[1.02] hover:-rotate-1">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </main>
    );
  }

  if (!formQuery.data) {
    return (
      <main className="theme-flowform-kingdom flex min-h-screen items-center justify-center text-zinc-200">
        <p className="rounded-xl border-2 border-black bg-zinc-950 px-6 py-4 font-flow-display text-lg text-zinc-100 shadow-[5px_5px_0px_#000]">
          Form not found
        </p>
      </main>
    );
  }

  const slug = formQuery.data.slug;
  const currentShareUrl = deployShareUrl || getShareUrl(slug);
  const completionPercent = Math.min(
    100,
    Math.round(
      (title.trim() ? 20 : 0) +
        (description.trim() ? 10 : 0) +
        (questions.filter((question) => question.title.trim()).length /
          Math.max(questions.length, 1)) *
          55 +
        (status === "published" ? 15 : 0),
    ),
  );
  const selectedQuestionIndex = Math.max(
    questions.findIndex((question) => question.clientId === selectedQuestion?.clientId),
    0,
  );

  return (
    <main className="theme-flowform-kingdom min-h-screen overflow-x-hidden text-zinc-200 selection:bg-zinc-800 selection:text-white">
      <header className="sticky top-0 z-50 border-b-2 border-black bg-zinc-950/80 backdrop-blur-md shadow-[3px_3px_0px_#000]">
        <div className="relative flex min-h-16 flex-wrap items-center justify-between gap-3 px-3 py-3 sm:min-h-20 sm:px-6 sm:py-0">
          <div className="flex min-w-0 items-center gap-4 xl:gap-6">
            <Link className="font-flow-display text-xl font-black uppercase tracking-tight text-white drop-shadow-[2px_2px_0px_#000] hover:scale-105 active:scale-95 transition-all inline-block sm:text-2xl" href="/dashboard">
              FlowForm
            </Link>
            <span className="hidden h-12 w-0.5 bg-zinc-800 md:block" />
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-lg font-black text-white">{title || "Untitled form"}</p>
              <div className="mt-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-zinc-400">
                <span>{status}</span>
                <span>/</span>
                <span>{visibility}</span>
              </div>
            </div>
          </div>

          <nav aria-label="Builder navigation" className="hidden items-center gap-1.5 rounded-full border-2 border-black bg-zinc-950 p-1.5 text-xs font-black uppercase tracking-wider lg:flex shadow-[2px_2px_0px_#000]">
            <Link className="rounded-full px-3.5 py-1.5 text-zinc-400 hover:text-zinc-100 hover:scale-105 active:scale-95 transition-all" href="/dashboard">
              Dashboard
            </Link>
            <span aria-current="page" className="rounded-full bg-zinc-200 text-zinc-950 border-2 border-black shadow-[1.5px_1.5px_0px_#000] px-3.5 py-1 font-black">
              Builder
            </span>
            <Dialog>
              <DialogTrigger asChild>
                <button className="rounded-full px-3.5 py-1.5 text-zinc-400 hover:text-zinc-100 hover:scale-105 active:scale-95 transition-all" type="button">
                  Design
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl rounded-xl border-2 border-black bg-zinc-950 text-zinc-250 shadow-[8px_8px_0px_#000]">
                <DialogHeader>
                  <DialogTitle className="font-flow-display text-3xl text-white drop-shadow-[2px_2px_0px_#000]">
                    Design Form Runner
                  </DialogTitle>
                  <DialogDescription className="text-xs text-zinc-400 uppercase font-bold tracking-wider">
                    Choose an interactive theme preset and customize color configurations.
                  </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-6">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      {
                        value: "default",
                        label: "Modern Default",
                        bg: "bg-teal-700",
                        colors: { background: "#fafafa", text: "#18181b", accent: "#0f766e" },
                      },
                      {
                        value: "spiderman",
                        label: "Spider-Man 🕷️",
                        bg: "bg-red-600",
                        colors: { background: "#0c1830", text: "#f8fafc", accent: "#ef4444" },
                      },
                      {
                        value: "batman",
                        label: "Dark Knight 🦇",
                        bg: "bg-neutral-800",
                        colors: { background: "#09090b", text: "#f4f4f5", accent: "#eab308" },
                      },
                      {
                        value: "cyberpunk",
                        label: "Cyberpunk ⚡",
                        bg: "bg-yellow-400",
                        colors: { background: "#0f0f15", text: "#facc15", accent: "#00f0ff" },
                      },
                      {
                        value: "sakura",
                        label: "Sakura 🌸",
                        bg: "bg-rose-300",
                        colors: { background: "#fff5f6", text: "#4c0519", accent: "#f43f5e" },
                      },
                    ].map((presetOption) => {
                      const isSelected = theme.preset === presetOption.value;
                      return (
                        <button
                          className={`border-2 p-4 text-left transition rounded-lg ${
                            isSelected
                              ? "border-black bg-zinc-200 text-zinc-950 font-black shadow-[3px_3px_0px_#000]"
                              : "border-black bg-zinc-950 hover:bg-zinc-800 hover:scale-[1.02] shadow-[2px_2px_0px_#000] text-zinc-200"
                          }`}
                          key={presetOption.value}
                          onClick={() => {
                            setTheme({
                              preset: presetOption.value,
                              background: presetOption.colors.background,
                              text: presetOption.colors.text,
                              accent: presetOption.colors.accent,
                            });
                          }}
                          type="button"
                        >
                          <span className={`mb-3 block size-5 rounded-full ${presetOption.bg} border-2 border-black`} />
                          <span className="font-bold uppercase tracking-wider text-xs">
                            {presetOption.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    {(["background", "text", "accent"] as const).map((key) => (
                      <label className="space-y-2" key={key}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          {key}
                        </span>
                        <div className="flex gap-2">
                          <input
                            className="size-11 cursor-pointer border-2 border-black bg-zinc-900 p-1"
                            onChange={(event) =>
                              setTheme((current) => ({ ...current, [key]: event.target.value }))
                            }
                            type="color"
                            value={theme[key].startsWith("#") ? theme[key] : "#fafafa"}
                          />
                          <Input
                            className="h-11 rounded-lg border-2 border-black bg-zinc-950 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[3px_3px_0px_#000]"
                            onChange={(event) =>
                              setTheme((current) => ({ ...current, [key]: event.target.value }))
                            }
                            value={theme[key]}
                          />
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <DialogFooter className="border-t-2 border-black pt-5 mt-6">
                  <DialogTrigger asChild>
                    <Button className="rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_#000] hover:bg-white active:scale-95 transition-all hover:scale-[1.02] hover:-rotate-1">
                      Done
                    </Button>
                  </DialogTrigger>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <button
              className="rounded-full px-3.5 py-1.5 text-zinc-400 hover:text-zinc-100 hover:scale-105 active:scale-95 transition-all"
              onClick={() => {
                void copyShareUrl(getShareUrl(slug)).then((copied) => {
                  if (!copied) return;
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                });
              }}
              type="button"
            >
              {copiedLink ? "Copied" : "Share"}
            </button>
            <Link className="rounded-full px-3.5 py-1.5 text-zinc-400 hover:text-zinc-100 hover:scale-105 active:scale-95 transition-all" href={`/forms/${formId}/results`}>
              Analytics
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-3">
            {status === "published" ? (
              <Button asChild size="icon" variant="ghost" className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border-2 border-transparent">
                <Link href={`/f/${slug}`} target="_blank">
                  <Eye />
                </Link>
              </Button>
            ) : null}
            <Button
              size="icon"
              variant="ghost"
              className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border-2 border-transparent"
              disabled={isWorking}
              onClick={() => void saveBuilder()}
            >
              {saveMutation.isPending ? <Loader2 className="animate-spin" /> : <Save />}
            </Button>
            <Button
              className="h-10 rounded-lg bg-zinc-200 px-3 text-[10px] text-zinc-950 border-2 border-black font-black uppercase tracking-wider shadow-[4px_4px_0px_#000] hover:bg-white active:scale-95 transition-all hover:scale-[1.02] hover:-rotate-1 sm:h-14 sm:px-8 sm:text-xs"
              disabled={isWorking}
              onClick={() => void deployForm()}
            >
              {isWorking ? <Loader2 className="animate-spin" /> : <Send />}
              Deploy
            </Button>
            {deployError ? (
              <div className="absolute right-4 top-[calc(100%+8px)] max-w-[min(92vw,440px)] rounded-lg border-2 border-black bg-rose-950 px-4 py-3 text-xs font-black uppercase tracking-wider text-rose-100 shadow-[4px_4px_0px_#000] sm:right-6">
                {deployError}
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <Dialog
        open={deployDialogOpen}
        onOpenChange={(open) => {
          setDeployDialogOpen(open);
          if (!open) setDeployCopied(false);
        }}
      >
        <DialogContent className="max-w-xl overflow-hidden rounded-2xl border-3 border-black bg-zinc-950 p-0 text-zinc-200 shadow-[10px_10px_0px_#000]">
          <div className="flow-kingdom-band border-b-3 border-black px-6 py-7 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-xl border-2 border-black bg-zinc-200 text-zinc-950 shadow-[4px_4px_0px_#000]">
              <Check className="size-7" />
            </span>
            <DialogHeader className="mt-5 text-center">
              <DialogTitle className="font-flow-display text-4xl text-white drop-shadow-[3px_3px_0px_#000]">
                Successfully Deployed
              </DialogTitle>
              <DialogDescription className="mx-auto max-w-sm text-xs font-bold uppercase tracking-wider text-zinc-400">
                Your form is live. Share this link with respondents and start collecting answers.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6 pt-5">
            <div className="rounded-xl border-2 border-black bg-zinc-900 p-4 shadow-[4px_4px_0px_#000]">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Share Link
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  className="h-12 rounded-lg border-2 border-black bg-zinc-950 text-xs font-bold text-zinc-200 shadow-[2px_2px_0px_#000] focus-visible:border-zinc-400 focus-visible:ring-0"
                  readOnly
                  value={currentShareUrl}
                />
                <Button
                  className="h-12 rounded-lg border-2 border-black bg-zinc-200 px-5 text-xs font-black uppercase tracking-wider text-zinc-950 shadow-[3px_3px_0px_#000] hover:bg-white active:scale-95"
                  onClick={() => {
                    void copyShareUrl(currentShareUrl).then((copied) => {
                      if (!copied) return;
                      setDeployCopied(true);
                      setTimeout(() => setDeployCopied(false), 2000);
                    });
                  }}
                  type="button"
                >
                  <Copy className="size-4" />
                  {deployCopied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <DialogFooter className="mt-6 grid gap-3 sm:grid-cols-3 sm:justify-stretch">
              <Button
                asChild
                className="h-11 rounded-lg border-2 border-black bg-zinc-200 text-xs font-black uppercase tracking-wider text-zinc-950 shadow-[3px_3px_0px_#000] hover:bg-white active:scale-95"
              >
                <Link href={`/f/${slug}`} target="_blank">
                  <Eye className="size-4" />
                  Open
                </Link>
              </Button>
              <Button
                asChild
                className="h-11 rounded-lg border-2 border-black bg-zinc-900 text-xs font-black uppercase tracking-wider text-zinc-200 shadow-[3px_3px_0px_#000] hover:bg-zinc-800 active:scale-95"
              >
                <Link href={`/forms/${formId}/results`}>
                  <BarChart3 className="size-4" />
                  Results
                </Link>
              </Button>
              <DialogClose asChild>
                <Button
                  className="h-11 rounded-lg border-2 border-black bg-zinc-950 text-xs font-black uppercase tracking-wider text-zinc-300 shadow-[3px_3px_0px_#000] hover:bg-zinc-900 active:scale-95"
                  type="button"
                >
                  Continue
                </Button>
              </DialogClose>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <section className="grid min-h-[calc(100vh-64px)] lg:h-[calc(100vh-80px)] lg:min-h-0 lg:overflow-hidden lg:grid-cols-[320px_minmax(460px,1fr)_400px]">
        <aside className="flex flex-col border-b-2 border-black bg-zinc-950 lg:min-h-0 lg:border-b-0 lg:border-r-2">
          <div className="flex items-center gap-4 border-b-2 border-black px-4 py-4 sm:px-5 sm:py-6">
            <span className="grid size-12 place-items-center rounded-lg border-2 border-black bg-zinc-800 text-zinc-200 shadow-[2px_2px_0px_#000]">
              <Hammer className="size-6" />
            </span>
            <div>
              <h2 className="text-xl font-flow-display text-white leading-none">Elements</h2>
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mt-1">Form Palette</p>
            </div>
          </div>

          <div className="max-h-[44vh] overflow-y-auto px-4 py-4 sm:px-5 sm:py-6 lg:max-h-none lg:flex-1">
            <p className="font-flow-display text-xs tracking-wider text-zinc-400 uppercase">Add Fields</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
              {fieldPalette.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    className="group flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border-2 border-black bg-zinc-950 px-3 text-center text-zinc-200 transition-all hover:-translate-y-1 hover:bg-zinc-900 active:scale-95 shadow-[3px_3px_0px_#000] hover:scale-[1.03] hover:-rotate-1 sm:min-h-24"
                    key={tool.value}
                    onClick={() => addQuestion(tool.value)}
                    type="button"
                  >
                    <Icon className="size-5 text-zinc-400 transition group-hover:scale-110 group-hover:text-zinc-200" />
                    <span className="text-xs font-semibold">{tool.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8">
              <p className="font-flow-display text-xs tracking-wider text-zinc-400 uppercase">
                Fields Order
              </p>
              <div className="mt-4 space-y-2">
                {questions.map((question, index) => {
                  const Icon = iconForType(question.type);
                  return (
                    <button
                      className={`w-full rounded-lg border-2 p-3 text-left transition-all ${
                        selectedQuestion?.clientId === question.clientId
                          ? "border-black bg-zinc-200 text-zinc-950 shadow-[3.5px_3.5px_0px_#000]"
                          : "border-black bg-zinc-950 text-zinc-400 hover:border-black/50 hover:bg-zinc-900 shadow-[2px_2px_0px_#000]"
                      }`}
                      key={question.clientId}
                      onClick={() => setSelectedId(question.clientId)}
                      type="button"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="size-4 shrink-0" />
                        <div className="min-w-0">
                          <p className={`text-[9px] font-black uppercase tracking-wider ${selectedQuestion?.clientId === question.clientId ? "text-zinc-600" : "text-zinc-500"}`}>
                            Q{index + 1} / {labelForType(question.type)}
                          </p>
                          <p className="truncate text-xs font-bold">{question.title}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="hidden border-t-2 border-black p-5 lg:block">
            <Link
              className="flex h-12 items-center justify-center gap-2.5 rounded-lg border-2 border-black bg-zinc-200 text-sm font-black uppercase tracking-wider text-zinc-950 shadow-[4px_4px_0px_#000] hover:bg-white active:scale-95 transition-all hover:scale-102 hover:-rotate-1"
              href="/pricing"
            >
              <Gem className="size-4" />
              Upgrade Plan
            </Link>
          </div>
        </aside>

        <section className="bg-zinc-900 px-4 py-6 sm:px-6 lg:min-h-0 lg:overflow-y-auto lg:py-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10">
              <div className="flex items-end justify-between">
                <p className="font-flow-display text-lg tracking-wider text-white">
                  Form Completion
                </p>
                <p className="text-2xl font-flow-display text-white">{completionPercent}%</p>
              </div>
              <div className="mt-3 rounded-none border-2 border-black bg-zinc-950 p-0.5 shadow-[2px_2px_0px_#000] h-6">
                <div
                  className="h-full rounded-none bg-zinc-200 border-r-2 border-black transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <div className="relative mx-auto max-w-3xl">
              <span className="absolute -left-5 -top-5 z-10 hidden size-12 -rotate-12 place-items-center rounded-lg border-2 border-black bg-zinc-800 text-zinc-200 shadow-[2.5px_2.5px_0px_#000] sm:grid">
                <Shield className="size-5" />
              </span>
              <span className="absolute -right-5 -top-5 z-10 hidden size-12 rotate-12 place-items-center rounded-lg border-2 border-black bg-zinc-800 text-zinc-200 shadow-[2.5px_2.5px_0px_#000] sm:grid">
                <Crown className="size-5" />
              </span>

              {/* HIGH CONTRAST COMIC PAPER CANVAS VIEW */}
              <div className="min-h-[560px] rounded-none bg-white border-2 border-black px-4 py-8 text-zinc-950 shadow-[5px_5px_0px_#000] sm:border-4 sm:px-8 sm:py-10 sm:shadow-[10px_10px_0px_#000] lg:min-h-[760px] lg:px-12 lg:py-14">
                <div className="border-b-2 border-black pb-6">
                  <Input
                    className="h-auto rounded-none border-0 bg-transparent px-0 text-2xl font-black text-zinc-950 shadow-none focus-visible:ring-0 focus-visible:border-0 sm:text-3xl"
                    onChange={(event) => {
                      setDeployError(null);
                      setTitle(event.target.value);
                    }}
                    value={title}
                  />
                  <Textarea
                    className="mt-3 min-h-16 resize-none rounded-none border-0 bg-transparent px-0 text-sm font-bold text-zinc-500 shadow-none focus-visible:ring-0 focus-visible:border-0"
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe this form..."
                    value={description}
                  />
                </div>

                <div className="mt-8 space-y-5 sm:mt-10 sm:space-y-8">
                  {questions.map((question, index) => (
                    <QuestionEditorCard
                      isSelected={selectedQuestion?.clientId === question.clientId}
                      key={question.clientId}
                      onAddOption={addOption}
                      onMove={moveQuestion}
                      onRemove={removeQuestion}
                      onRemoveOption={removeOption}
                      onSelect={setSelectedId}
                      onUpdateOption={updateOption}
                      onUpdateQuestion={updateQuestion}
                      question={question}
                      questionIndex={index}
                      totalQuestions={questions.length}
                    />
                  ))}
                </div>
              </div>

              <span className="font-flow-display absolute -bottom-6 left-1/2 hidden -translate-x-1/2 rounded-lg border-2 border-black bg-zinc-200 px-12 py-3 text-sm tracking-widest text-zinc-950 shadow-[3px_3px_0px_#000] font-black uppercase whitespace-nowrap sm:block">
                Active Form Canvas
              </span>
            </div>
          </div>
        </section>

        <aside className="flex flex-col border-t-2 border-black bg-zinc-950 lg:min-h-0 lg:border-l-2 lg:border-t-0">
          <div className="flex items-center gap-4 border-b-2 border-black px-4 py-4 sm:px-6 sm:py-5">
            <span className="grid size-10 place-items-center text-zinc-200 border-2 border-black bg-zinc-800 rounded-lg shadow-[2px_2px_0px_#000]">
              <Settings className="size-5" />
            </span>
            <div>
              <h2 className="text-xl font-flow-display text-white leading-none">Settings</h2>
              <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 mt-1">Field Config</p>
            </div>
          </div>

          {selectedQuestion ? (
            <div className="px-4 py-5 sm:px-6 lg:flex-1 lg:overflow-y-auto">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Field {selectedQuestionIndex + 1} of {questions.length}
                </p>
                <div className="flex gap-1">
                  <Button
                    className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 h-8 w-8"
                    onClick={() => moveQuestion(selectedQuestion.clientId, -1)}
                    size="icon"
                    variant="ghost"
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 h-8 w-8"
                    onClick={() => moveQuestion(selectedQuestion.clientId, 1)}
                    size="icon"
                    variant="ghost"
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                </div>
              </div>

              <label className="block space-y-2">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <ScrollText className="size-3.5" />
                  Question Title
                </span>
                <Textarea
                  className="min-h-16 rounded-lg border-2 border-black bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[3px_3px_0px_#000]"
                  onChange={(event) =>
                    updateQuestion(selectedQuestion.clientId, { title: event.target.value })
                  }
                  value={selectedQuestion.title}
                />
              </label>

              <label className="mt-5 block space-y-2">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                  <Wand2 className="size-3.5" />
                  Placeholder Text
                </span>
                <Input
                  className="h-11 rounded-lg border-2 border-black bg-zinc-950 text-xs text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[3px_3px_0px_#000]"
                  onChange={(event) =>
                    updateQuestion(selectedQuestion.clientId, {
                      placeholder: event.target.value,
                    })
                  }
                  placeholder="Type placeholder here..."
                  value={selectedQuestion.placeholder ?? ""}
                />
              </label>

              <label className="mt-5 block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Field Type
                </span>
                <Select
                  onValueChange={(value) =>
                    updateQuestion(selectedQuestion.clientId, { type: value as QuestionType })
                  }
                  value={selectedQuestion.type}
                >
                  <SelectTrigger className="h-11 rounded-lg border-2 border-black bg-zinc-955 text-xs text-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {questionTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="mt-5 block space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Field Description
                </span>
                <Textarea
                  className="min-h-16 rounded-lg border-2 border-black bg-zinc-950 text-xs text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[3px_3px_0px_#000]"
                  onChange={(event) =>
                    updateQuestion(selectedQuestion.clientId, {
                      description: event.target.value,
                    })
                  }
                  value={selectedQuestion.description ?? ""}
                />
              </label>

              <div className="mt-5 rounded-xl border-2 border-black bg-zinc-900 p-4 shadow-[3px_3px_0px_#000]">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-white uppercase">Required Field</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                      Mandatory response
                    </p>
                  </div>
                  <Switch
                    checked={selectedQuestion.required}
                    onCheckedChange={(required) =>
                      updateQuestion(selectedQuestion.clientId, { required })
                    }
                  />
                </div>
              </div>

              <div className="mt-5 rounded-xl border-2 border-black bg-zinc-900 p-4 shadow-[3px_3px_0px_#000]">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Element Metrics
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="flex h-12 flex-col items-center justify-center rounded-lg border-2 border-black bg-zinc-950 text-xs font-bold text-zinc-300">
                    <span className="text-[9px] text-zinc-500 uppercase">Index</span>
                    <span className="text-sm font-black">{selectedQuestionIndex + 1}</span>
                  </div>
                  <div className="flex h-12 flex-col items-center justify-center rounded-lg border-2 border-black bg-zinc-950 text-xs font-bold text-zinc-300">
                    <span className="text-[9px] text-zinc-500 uppercase">Options</span>
                    <span className="text-sm font-black">{selectedQuestion.options.length}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border-2 border-black bg-zinc-900 p-4 shadow-[3px_3px_0px_#000]">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Form Visibility
                </p>
                <Select
                  onValueChange={(value) => setVisibility(value as "public" | "unlisted")}
                  value={visibility}
                >
                  <SelectTrigger className="mt-3 h-11 rounded-lg border-2 border-black bg-zinc-950 text-xs text-zinc-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public listing</SelectItem>
                    <SelectItem value="unlisted">Unlisted link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {["short_text", "long_text", "email"].includes(selectedQuestion.type) ? (
                <div className="mt-5 rounded-xl border-2 border-black bg-zinc-900 p-4 shadow-[3px_3px_0px_#000]">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Text Validation
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Input
                      className="h-10 rounded-lg border-2 border-black bg-zinc-950 text-xs text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[2px_2px_0px_#000]"
                      min={0}
                      onChange={(event) =>
                        updateValidation(selectedQuestion.clientId, {
                          minLength: parseNumberField(event.target.value, true),
                        })
                      }
                      placeholder="Min length"
                      type="number"
                      value={selectedQuestion.validation.minLength ?? ""}
                    />
                    <Input
                      className="h-10 rounded-lg border-2 border-black bg-zinc-950 text-xs text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[2px_2px_0px_#000]"
                      min={1}
                      onChange={(event) =>
                        updateValidation(selectedQuestion.clientId, {
                          maxLength: parseNumberField(event.target.value, true),
                        })
                      }
                      placeholder="Max length"
                      type="number"
                      value={selectedQuestion.validation.maxLength ?? ""}
                    />
                  </div>
                  <Input
                    className="mt-3 h-10 rounded-lg border-2 border-black bg-zinc-950 text-xs text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[2px_2px_0px_#000]"
                    onChange={(event) =>
                      updateValidation(selectedQuestion.clientId, {
                        pattern: event.target.value || null,
                      })
                    }
                    placeholder="RegEx Pattern"
                    value={selectedQuestion.validation.pattern ?? ""}
                  />
                </div>
              ) : null}

              {["number", "rating"].includes(selectedQuestion.type) ? (
                <div className="mt-5 rounded-xl border-2 border-black bg-zinc-900 p-4 shadow-[3px_3px_0px_#000]">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Number Bounds
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Input
                      className="h-10 rounded-lg border-2 border-black bg-zinc-950 text-xs text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[2px_2px_0px_#000]"
                      onChange={(event) =>
                        updateValidation(selectedQuestion.clientId, {
                          min: parseNumberField(event.target.value),
                        })
                      }
                      placeholder="Min val"
                      type="number"
                      value={selectedQuestion.validation.min ?? ""}
                    />
                    <Input
                      className="h-10 rounded-lg border-2 border-black bg-zinc-950 text-xs text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[2px_2px_0px_#000]"
                      onChange={(event) =>
                        updateValidation(selectedQuestion.clientId, {
                          max: parseNumberField(event.target.value),
                        })
                      }
                      placeholder="Max val"
                      type="number"
                      value={selectedQuestion.validation.max ?? ""}
                    />
                  </div>
                </div>
              ) : null}

              {isOptionType(selectedQuestion.type) ? (
                <div className="mt-5 rounded-xl border-2 border-black bg-zinc-900 p-4 shadow-[3px_3px_0px_#000]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Choice Options
                    </p>
                    <Button
                      className="rounded-md border-2 border-black bg-zinc-200 text-zinc-950 shadow-[1.5px_1.5px_0px_#000] font-black uppercase text-[10px] tracking-wider hover:bg-white active:scale-95 transition-all"
                      onClick={() => addOption(selectedQuestion.clientId)}
                      size="sm"
                    >
                      <Plus className="size-3" />
                      Add
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {selectedQuestion.options.map((option, index) => (
                      <div className="flex gap-2" key={`${selectedQuestion.clientId}-${index}`}>
                        <Input
                          className="h-10 rounded-lg border-2 border-black bg-zinc-950 text-xs text-zinc-200 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[2px_2px_0px_#000]"
                          onChange={(event) =>
                            updateOption(selectedQuestion.clientId, index, event.target.value)
                          }
                          value={option.label}
                        />
                        <Button
                          className="text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 h-10 w-10 border-2 border-transparent"
                          onClick={() => removeOption(selectedQuestion.clientId, index)}
                          size="icon"
                          variant="ghost"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="border-t-2 border-black p-6">
            {status === "published" ? (
              <Button
                className="mb-4 h-12 w-full rounded-lg border-2 border-black bg-zinc-950 text-xs font-black uppercase tracking-wider text-zinc-200 shadow-[3px_3px_0px_#000] hover:bg-zinc-900 active:scale-95 transition-all hover:scale-102 hover:-rotate-1"
                disabled={isWorking}
                onClick={() => void unpublish()}
              >
                Return to draft
              </Button>
            ) : null}
            <Button
              className="h-14 w-full rounded-lg border-2 border-rose-600 bg-rose-950/40 text-rose-200 hover:bg-rose-650 hover:text-white shadow-[3px_3px_0px_#000] hover:scale-102 hover:rotate-1 active:scale-95 transition-all font-black uppercase text-xs tracking-wider"
              disabled={!selectedQuestion}
              onClick={() => selectedQuestion && removeQuestion(selectedQuestion.clientId)}
            >
              <Trash2 className="size-5 mr-1.5" />
              Delete Question
            </Button>
          </div>
        </aside>
      </section>
    </main>
  );
}

function QuestionEditorCard({
  isSelected,
  onAddOption,
  onMove,
  onRemove,
  onRemoveOption,
  onSelect,
  onUpdateOption,
  onUpdateQuestion,
  question,
  questionIndex,
  totalQuestions,
}: {
  isSelected: boolean;
  onAddOption: (clientId: string) => void;
  onMove: (clientId: string, direction: -1 | 1) => void;
  onRemove: (clientId: string) => void;
  onRemoveOption: (clientId: string, index: number) => void;
  onSelect: (clientId: string) => void;
  onUpdateOption: (clientId: string, index: number, label: string) => void;
  onUpdateQuestion: (clientId: string, patch: Partial<DraftQuestion>) => void;
  question: DraftQuestion;
  questionIndex: number;
  totalQuestions: number;
}) {
  const Icon = iconForType(question.type);
  const canMoveUp = questionIndex > 0;
  const canMoveDown = questionIndex < totalQuestions - 1;

  return (
    <article
      className={`border-2 p-4 transition-all rounded-none sm:p-5 ${
        isSelected
          ? "border-black bg-zinc-50 shadow-[4px_4px_0px_#000] scale-[1.01]"
          : "border-dashed border-zinc-300 bg-white hover:bg-zinc-50 hover:shadow-[3px_3px_0px_#000]"
      }`}
      onClick={() => onSelect(question.clientId)}
    >
      <div className="mb-5 flex flex-col gap-3 border-b-2 border-zinc-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg border-2 border-black bg-zinc-900 text-zinc-100 shadow-[2px_2px_0px_#000]">
            <Icon className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
              Question {questionIndex + 1}
            </p>
            <p className="truncate text-xs font-bold uppercase tracking-wider text-zinc-950">
              {labelForType(question.type)}
            </p>
          </div>
        </div>

        <Select
          onValueChange={(value) =>
            onUpdateQuestion(question.clientId, { type: value as QuestionType })
          }
          value={question.type}
        >
          <SelectTrigger
            className="h-11 w-full rounded-none border-2 border-black bg-white text-xs font-black uppercase tracking-wider text-zinc-950 shadow-[2px_2px_0px_#000] lg:w-56"
            onClick={(event) => {
              event.stopPropagation();
              onSelect(question.clientId);
            }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {questionTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <Textarea
          className="min-h-14 resize-none rounded-none border-0 border-b-2 border-zinc-300 bg-transparent px-0 text-lg font-black text-zinc-950 shadow-none focus-visible:border-black focus-visible:ring-0 sm:text-xl"
          onChange={(event) =>
            onUpdateQuestion(question.clientId, { title: event.target.value })
          }
          onClick={(event) => {
            event.stopPropagation();
            onSelect(question.clientId);
          }}
          onFocus={() => onSelect(question.clientId)}
          placeholder="Question"
          value={question.title}
        />
        <Input
          className="h-10 rounded-none border-0 border-b-2 border-dashed border-zinc-300 bg-transparent px-0 text-xs font-semibold text-zinc-600 shadow-none focus-visible:border-black focus-visible:ring-0"
          onChange={(event) =>
            onUpdateQuestion(question.clientId, {
              description: event.target.value || null,
            })
          }
          onClick={(event) => {
            event.stopPropagation();
            onSelect(question.clientId);
          }}
          onFocus={() => onSelect(question.clientId)}
          placeholder="Description or help text"
          value={question.description ?? ""}
        />

        {isOptionType(question.type) ? (
          <div className="space-y-3 pt-2">
            {question.options.map((option, optionIndex) => (
              <div className="flex items-center gap-2 sm:gap-3" key={`${question.clientId}-${optionIndex}`}>
                <span
                  className={`grid size-5 shrink-0 place-items-center border-2 border-black ${
                    question.type === "multiple_choice" ? "rounded-none" : "rounded-full"
                  }`}
                >
                  {question.type === "dropdown" ? (
                    <span className="text-[10px] font-black text-zinc-950">{optionIndex + 1}</span>
                  ) : null}
                </span>
                <Input
                  className="h-10 rounded-none border-0 border-b-2 border-zinc-300 bg-transparent px-0 text-sm font-semibold text-zinc-900 shadow-none focus-visible:border-black focus-visible:ring-0"
                  onChange={(event) =>
                    onUpdateOption(question.clientId, optionIndex, event.target.value)
                  }
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(question.clientId);
                  }}
                  onFocus={() => onSelect(question.clientId)}
                  placeholder={`Option ${optionIndex + 1}`}
                  value={option.label}
                />
                <Button
                  className="size-9 shrink-0 rounded-none border-2 border-transparent text-zinc-500 hover:border-black hover:bg-zinc-100 hover:text-zinc-950"
                  disabled={question.options.length <= 1}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveOption(question.clientId, optionIndex);
                  }}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}

            <button
              className="ml-7 inline-flex items-center gap-2 rounded-none border-b-2 border-dashed border-zinc-400 pb-1 text-xs font-black uppercase tracking-wider text-zinc-600 transition hover:border-black hover:text-zinc-950 sm:ml-8"
              onClick={(event) => {
                event.stopPropagation();
                onAddOption(question.clientId);
              }}
              type="button"
            >
              <Plus className="size-4" />
              Add option
            </button>
          </div>
        ) : (
          <div className="pt-2">
            <QuestionPreview question={question} />
            {["short_text", "long_text", "email", "number", "date"].includes(question.type) ? (
              <Input
                className="mt-3 h-10 rounded-none border-0 border-b-2 border-dashed border-zinc-300 bg-transparent px-0 text-xs font-semibold text-zinc-600 shadow-none focus-visible:border-black focus-visible:ring-0"
                onChange={(event) =>
                  onUpdateQuestion(question.clientId, {
                    placeholder: event.target.value || null,
                  })
                }
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(question.clientId);
                }}
                onFocus={() => onSelect(question.clientId)}
                placeholder="Placeholder text"
                value={question.placeholder ?? ""}
              />
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t-2 border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            className="size-9 rounded-none border-2 border-black bg-white text-zinc-950 shadow-[2px_2px_0px_#000] hover:bg-zinc-100 disabled:opacity-40"
            disabled={!canMoveUp}
            onClick={(event) => {
              event.stopPropagation();
              onMove(question.clientId, -1);
            }}
            size="icon"
            type="button"
            variant="outline"
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            className="size-9 rounded-none border-2 border-black bg-white text-zinc-950 shadow-[2px_2px_0px_#000] hover:bg-zinc-100 disabled:opacity-40"
            disabled={!canMoveDown}
            onClick={(event) => {
              event.stopPropagation();
              onMove(question.clientId, 1);
            }}
            size="icon"
            type="button"
            variant="outline"
          >
            <ArrowDown className="size-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <label
            className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-700"
            onClick={(event) => event.stopPropagation()}
          >
            Required
            <Switch
              checked={question.required}
              onCheckedChange={(required) => onUpdateQuestion(question.clientId, { required })}
            />
          </label>
          <Button
            className="h-9 rounded-none border-2 border-rose-700 bg-white px-3 text-xs font-black uppercase tracking-wider text-rose-700 shadow-[2px_2px_0px_#000] hover:bg-rose-50"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(question.clientId);
            }}
            type="button"
            variant="outline"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}

function QuestionPreview({ question }: { question: DraftQuestion }) {
  if (question.type === "long_text") {
    return (
      <Textarea
        className="min-h-24 rounded-none border-2 border-black bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:border-black shadow-[2px_2px_0px_#000]"
        disabled
        placeholder={question.placeholder ?? "Long answer"}
      />
    );
  }

  if (question.type === "single_choice" || question.type === "dropdown") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => (
          <div
            className="flex items-center gap-3 rounded-none border-2 border-dashed border-zinc-400 bg-white p-3 text-zinc-800"
            key={option.value}
          >
            <span className="grid size-5 place-items-center rounded-full border-2 border-black">
              {question.type === "dropdown" ? <Check className="size-2.5" /> : null}
            </span>
            <span className="font-semibold text-xs">{option.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (question.type === "multiple_choice") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((option) => (
          <div
            className="flex items-center gap-3 rounded-none border-2 border-dashed border-zinc-400 bg-white p-3 text-zinc-800"
            key={option.value}
          >
            <span className="size-5 rounded-none border-2 border-black" />
            <span className="font-semibold text-xs">{option.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (question.type === "rating") {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <span
            className="grid size-10 place-items-center rounded-none border-2 border-black bg-zinc-100 text-sm font-black text-zinc-900 shadow-[1.5px_1.5px_0px_#000]"
            key={value}
          >
            {value}
          </span>
        ))}
      </div>
    );
  }

  if (question.type === "yes_no") {
    return (
      <div className="flex gap-2">
        <Button disabled variant="outline" className="rounded-none border-2 border-black bg-zinc-100 text-zinc-900 h-9 px-4 text-xs font-black shadow-[1.5px_1.5px_0px_#000]">
          Yes
        </Button>
        <Button disabled variant="outline" className="rounded-none border-2 border-black bg-zinc-100 text-zinc-900 h-9 px-4 text-xs font-black shadow-[1.5px_1.5px_0px_#000]">
          No
        </Button>
      </div>
    );
  }

  return (
    <Input
      className="h-12 rounded-none border-2 border-black bg-zinc-50 px-4 text-sm text-zinc-900 placeholder:text-zinc-400 shadow-[2px_2px_0px_#000] focus-visible:ring-0 focus-visible:border-black"
      disabled
      placeholder={question.placeholder ?? labelForType(question.type)}
      type={question.type === "number" ? "number" : question.type === "date" ? "date" : "text"}
    />
  );
}
