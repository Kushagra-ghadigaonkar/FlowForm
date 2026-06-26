"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RouterOutputs } from "@repo/trpc/client";
import type React from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Check,
  CircleDollarSign,
  Copy,
  Eye,
  ExternalLink,
  FilePlus2,
  ListFilter,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Search,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { trpc } from "~/trpc/client";
import { SiteNav } from "~/components/forms/site-nav";

const formTemplates = [
  {
    label: "Feedback",
    title: "Customer feedback",
    description: "A quick conversational survey for product feedback.",
  },
  {
    label: "Lead capture",
    title: "Lead qualification",
    description: "Collect contact details and qualify new prospects.",
  },
  {
    label: "Event RSVP",
    title: "Event RSVP",
    description: "Confirm attendance, preferences, and guest details.",
  },
];

const creativeTemplates = [
  {
    label: "Spider-Verse 🕷️",
    title: "Spider-Verse Recruitment",
    description: "Are you ready to swing into action? Select your dimensional suit, list spider-abilities, and report multiverse anomalies.",
  },
  {
    label: "Gotham 🦇",
    title: "Wayne Enterprises Survey",
    description: "Help us test new high-altitude defense prototypes. Confidentiality agreements and bat-sensor data collection apply.",
  },
  {
    label: "Netrunner ⚡",
    title: "Afterlife Netrunner Contract",
    description: "Initiate cybernetic contract. Choose your hackware deck, upload security exploits, and claim your street credits.",
  },
];


type AuthUser = NonNullable<RouterOutputs["auth"]["me"]>;
type DashboardForm = RouterOutputs["forms"]["list"][number];
type FilterKey = "all" | "published" | "draft" | "public" | "unlisted";
type SortKey =
  | "updated-desc"
  | "updated-asc"
  | "created-desc"
  | "created-asc"
  | "title-asc"
  | "title-desc";

const filterLabels: Record<FilterKey, string> = {
  all: "All forms",
  published: "Published",
  draft: "Drafts",
  public: "Public",
  unlisted: "Unlisted",
};

const sortLabels: Record<SortKey, string> = {
  "updated-desc": "Recently updated",
  "updated-asc": "Oldest updated",
  "created-desc": "Newest created",
  "created-asc": "Oldest created",
  "title-asc": "Title A-Z",
  "title-desc": "Title Z-A",
};

function statusBadge(status: "draft" | "published") {
  if (status === "published") return "border-2 border-black bg-zinc-200 text-zinc-950 font-black uppercase text-[9px] shadow-[1.5px_1.5px_0_#000]";
  return "border-2 border-black bg-zinc-900 text-zinc-400 font-bold uppercase text-[9px]";
}

function visibilityBadge(visibility: "public" | "unlisted") {
  if (visibility === "public") return "border-2 border-black bg-zinc-800 text-zinc-100 font-black uppercase text-[9px] shadow-[1.5px_1.5px_0_#000]";
  return "border-2 border-zinc-800 bg-zinc-950 text-zinc-500 font-semibold uppercase text-[9px]";
}

function dateValue(value: string | null) {
  return value ? new Date(value).getTime() : 0;
}

function latestDateValue(form: DashboardForm) {
  return dateValue(form.updatedAt ?? form.createdAt);
}

function sortForms(rows: DashboardForm[], sortBy: SortKey) {
  return [...rows].sort((left, right) => {
    switch (sortBy) {
      case "updated-asc":
        return latestDateValue(left) - latestDateValue(right);
      case "created-desc":
        return dateValue(right.createdAt) - dateValue(left.createdAt);
      case "created-asc":
        return dateValue(left.createdAt) - dateValue(right.createdAt);
      case "title-asc":
        return left.title.localeCompare(right.title);
      case "title-desc":
        return right.title.localeCompare(left.title);
      case "updated-desc":
      default:
        return latestDateValue(right) - latestDateValue(left);
    }
  });
}

export function DashboardClient() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const me = trpc.auth.me.useQuery(undefined);
  const forms = trpc.forms.list.useQuery(undefined, { enabled: !!me.data });
  const [title, setTitle] = useState("Customer feedback");
  const [description, setDescription] = useState("A quick conversational survey for product feedback.");
  const [query, setQuery] = useState("");
  const [filterBy, setFilterBy] = useState<FilterKey>("all");
  const [sortBy, setSortBy] = useState<SortKey>("updated-desc");
  const [copiedFormId, setCopiedFormId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DashboardForm | null>(null);
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);
  const [bulkDeleteError, setBulkDeleteError] = useState<string | null>(null);

  const createForm = trpc.forms.create.useMutation({
    async onSuccess(form) {
      await utils.forms.list.invalidate();
      router.push(`/forms/${form.id}/builder`);
    },
  });

  const logout = trpc.auth.logout.useMutation();
  const removeForm = trpc.forms.remove.useMutation({
    async onSuccess() {
      setDeleteTarget(null);
      await utils.forms.list.invalidate();
      await utils.forms.publicList.invalidate();
    },
  });
  const bulkRemoveForm = trpc.forms.remove.useMutation();

  async function handleLogout() {
    await logout.mutateAsync(null);
    utils.auth.me.setData(undefined, null);
    utils.forms.list.setData(undefined, []);
    await utils.auth.me.invalidate();
    await utils.forms.list.invalidate();
  }

  const visibleForms = useMemo(() => {
    let rows = forms.data ?? [];
    if (filterBy !== "all") {
      rows = rows.filter((form) =>
        filterBy === "published" || filterBy === "draft"
          ? form.status === filterBy
          : form.visibility === filterBy,
      );
    }

    const value = query.trim().toLowerCase();
    if (value) {
      rows = rows.filter(
        (form) =>
          form.title.toLowerCase().includes(value) ||
          form.slug.toLowerCase().includes(value) ||
          form.status.toLowerCase().includes(value) ||
          form.visibility.toLowerCase().includes(value) ||
          (form.description ?? "").toLowerCase().includes(value),
      );
    }

    return sortForms(rows, sortBy);
  }, [filterBy, forms.data, query, sortBy]);

  const visibleFormIds = visibleForms.map((form) => form.id);
  const selectedVisibleCount = visibleFormIds.filter((id) => selectedFormIds.includes(id)).length;
  const allVisibleSelected = visibleFormIds.length > 0 && selectedVisibleCount === visibleFormIds.length;
  const selectedForms = (forms.data ?? []).filter((form) => selectedFormIds.includes(form.id));

  function toggleFormSelection(formId: string) {
    setSelectedFormIds((current) =>
      current.includes(formId)
        ? current.filter((id) => id !== formId)
        : [...current, formId],
    );
  }

  function toggleVisibleForms() {
    const visibleSet = new Set(visibleFormIds);
    setSelectedFormIds((current) => {
      if (allVisibleSelected) return current.filter((id) => !visibleSet.has(id));
      const next = new Set(current);
      visibleFormIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  }

  async function deleteSelectedForms() {
    const idsToDelete = selectedForms.map((form) => form.id);
    if (!idsToDelete.length) return;

    setBulkDeleteError(null);
    setBulkDeletePending(true);

    try {
      for (const formId of idsToDelete) {
        await bulkRemoveForm.mutateAsync({ formId });
      }

      setSelectedFormIds((current) => current.filter((id) => !idsToDelete.includes(id)));
      setBulkDeleteOpen(false);
      await utils.forms.list.invalidate();
      await utils.forms.publicList.invalidate();
    } catch (error) {
      setBulkDeleteError(error instanceof Error ? error.message : "Unable to delete selected forms.");
    } finally {
      setBulkDeletePending(false);
    }
  }

  if (me.isLoading) return <DashboardLoading label="Checking your session" />;
  if (!me.data) return <AuthScreen />;

  const publishedCount = forms.data?.filter((form) => form.status === "published").length ?? 0;
  const publicCount = forms.data?.filter((form) => form.visibility === "public").length ?? 0;

  return (
    <main className="theme-flowform-kingdom flow-dashboard-shell relative min-h-screen overflow-hidden text-zinc-200 selection:bg-zinc-200 selection:text-zinc-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] opacity-25 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05),transparent_40rem)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/30 to-zinc-950" />
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <svg className="flow-dashboard-lines h-full w-full text-white/5" fill="none" stroke="currentColor" viewBox="0 0 1000 600">
          <path d="M-80 20 Q260 250 600 60 T1080 120" strokeWidth="2" />
          <path d="M120 -60 Q420 240 960 20" strokeDasharray="8 8" strokeWidth="1.5" />
          <path d="M0 420 Q300 220 640 520 T1120 340" strokeWidth="1" />
        </svg>
      </div>

      <div className="relative z-10">
        <SiteNav active="dashboard" />

        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-5 py-8 lg:px-8">
          <section className="flow-dashboard-rise flow-dashboard-hero flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <Badge
                className="mb-4 rounded border-2 border-black bg-zinc-200 text-zinc-950 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#000]"
                variant="outline"
              >
                <LayoutDashboard className="mr-2 size-4" />
                Workspace
              </Badge>
              <h2 className="font-flow-display text-4xl leading-[1.05] tracking-tight text-white md:text-5xl drop-shadow-[3px_3px_0px_#000]">
                Manage your
                <span className="block text-zinc-400">conversational campaigns.</span>
              </h2>
              <p className="mt-4 max-w-2xl text-xs font-semibold uppercase leading-relaxed text-zinc-550 tracking-wider">
                Design conversational workflows, copy share links, analyze responses, and organize campaigns.
              </p>
            </div>

            {/* STUNNING ANIMATED DETECTIVE COMIC DESK DESKTOP EXCLUSIVE HERO */}
            <div className="hidden lg:flex relative items-center justify-center px-6 py-5 w-[320px] rounded-xl border-2 border-black bg-zinc-950 shadow-[5px_5px_0px_#000] overflow-hidden group hover:scale-[1.02] hover:-rotate-1 active:scale-98 transition-all shrink-0">
              <div className="absolute inset-0 theme-flowform-kingdom opacity-[0.25] pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-3 text-center w-full">
                <div className="relative mx-auto size-14 animate-spiderman-hover-leap">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-zinc-200" fill="currentColor">
                    <path d="M15,50 C20,35 30,30 50,30 C70,30 80,35 85,50 C95,50 95,55 85,55 L15,55 C5,55 5,50 15,50 Z" stroke="#000" strokeWidth="3" fill="#27272a" />
                    <path d="M30,30 C30,10 40,5 50,5 C60,5 70,10 70,30 Z" stroke="#000" strokeWidth="3" fill="#18181b" />
                    <rect x="29" y="26" width="42" height="4" fill="#71717a" stroke="#000" strokeWidth="1" />
                    <ellipse cx="40" cy="46" rx="6" ry="2" fill="#fff" />
                    <ellipse cx="60" cy="46" rx="6" ry="2" fill="#fff" />
                    <path d="M50,55 L50,85 M50,85 L20,95 M50,85 L80,95" stroke="#a1a1aa" strokeWidth="2" strokeDasharray="3 3" />
                  </svg>
                </div>
                <div>
                  <div className="inline-block rounded-full bg-zinc-800 text-zinc-200 border-2 border-black px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_#000] mb-2 animate-pulse">
                    Multiverse Sandbox
                  </div>
                  <p className="font-flow-display text-[10px] leading-[1.25] text-zinc-300">
                    "With great forms comes great response conversion."
                  </p>
                  <p className="mt-1 text-[8px] font-mono text-zinc-555 uppercase tracking-widest font-black">
                    - Detective Noir V2
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="flow-dashboard-cta h-12 w-full lg:w-48 rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_#000] hover:bg-white active:scale-95 transition-all self-stretch lg:self-auto"
              onClick={() => {
                const formTitle = title.trim() || "Untitled form";
                createForm.mutate({
                  title: formTitle,
                  description: description.trim() || null,
                });
              }}
              disabled={createForm.isPending}
            >
              {createForm.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
              Create form
            </Button>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric icon={<FilePlus2 className="size-5" />} index={0} label="Total forms" value={forms.data?.length ?? 0} />
            <Metric icon={<ExternalLink className="size-5" />} index={1} label="Published" value={publishedCount} />
            <Metric icon={<Sparkles className="size-5" />} index={2} label="Public gallery" value={publicCount} />
            <Metric icon={<BarChart3 className="size-5" />} index={3} label="Drafts" value={(forms.data?.length ?? 0) - publishedCount} />
          </section>

          <section className="grid gap-7 lg:grid-cols-[420px_minmax(0,_1fr)]">
            <aside className="flow-dashboard-panel h-fit rounded-xl border-2 border-black bg-zinc-950 p-6 shadow-[5px_5px_0px_#000]" style={{ animationDelay: "220ms" }}>
              <div className="flex items-center justify-between gap-4 border-b-2 border-black pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 border-2 border-black shadow-[2px_2px_0px_#000]">
                    <FilePlus2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">
                      Builder Core
                    </p>
                    <h3 className="font-flow-display text-xl leading-none text-zinc-150">
                      Create Form
                    </h3>
                  </div>
                </div>
                <Sparkles className="size-5 text-zinc-400" />
              </div>

              <div className="mt-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                  SaaS Presets
                </p>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  {formTemplates.map((template) => (
                    <button
                      className="flow-dashboard-template rounded-lg border-2 border-black bg-zinc-950 px-3 py-2.5 text-left text-xs transition hover:bg-zinc-800 active:scale-95 shadow-[2px_2px_0px_#000] hover:scale-[1.02] hover:-rotate-1"
                      key={template.label}
                      onClick={() => {
                        setTitle(template.title);
                        setDescription(template.description);
                      }}
                      type="button"
                    >
                      <span className="block font-bold uppercase tracking-wider text-zinc-200">{template.label}</span>
                      <span className="mt-0.5 block text-[10px] text-zinc-450 leading-tight truncate">{template.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-2">
                  Creative Sandbox Themes
                </p>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  {creativeTemplates.map((template) => (
                    <button
                      className="flow-dashboard-template rounded-lg border-2 border-black bg-zinc-950 px-3 py-2.5 text-left text-xs transition hover:bg-zinc-800 active:scale-95 shadow-[2px_2px_0px_#000] hover:scale-[1.02] hover:-rotate-1"
                      key={template.label}
                      onClick={() => {
                        setTitle(template.title);
                        setDescription(template.description);
                      }}
                      type="button"
                    >
                      <span className="block font-bold uppercase tracking-wider text-zinc-200">{template.label}</span>
                      <span className="mt-0.5 block text-[10px] text-zinc-450 leading-tight truncate">{template.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <form
                className="mt-5 space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  createForm.mutate({
                    title,
                    description: description.trim() || null,
                  });
                }}
              >
                <label className="block space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Form Title
                  </span>
                  <Input
                    className="h-11 rounded-lg border-2 border-black bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[3px_3px_0px_#000]"
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Customer feedback"
                    required
                    value={title}
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                    Form Description
                  </span>
                  <Textarea
                    className="min-h-24 resize-none rounded-lg border-2 border-black bg-zinc-950 text-xs text-zinc-300 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[3px_3px_0px_#000]"
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Tell your audience what this form is about."
                    value={description}
                  />
                </label>

                <Button
                  className="h-11 w-full rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_#000] hover:bg-white active:scale-95 transition-all hover:scale-[1.02] hover:-rotate-1"
                  disabled={createForm.isPending}
                >
                  {createForm.isPending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                  Build Form
                </Button>

                {createForm.error ? (
                  <div className="flex items-start gap-2 rounded-lg border-2 border-rose-600 bg-rose-950/15 p-3 text-xs text-rose-455">
                    <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
                    <p>{createForm.error.message}</p>
                  </div>
                ) : null}
              </form>
            </aside>

            <section className="flow-dashboard-panel min-w-0 rounded-xl border-2 border-black bg-zinc-950 shadow-[6px_6px_0px_#000]" style={{ animationDelay: "280ms" }}>
              <div className="flex flex-col gap-5 border-b-2 border-black p-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">
                    Campaign List
                  </p>
                  <h3 className="font-flow-display text-2xl leading-none text-zinc-100">Active campaigns</h3>
                  <p className="mt-1 text-xs text-zinc-400 font-medium">
                    Manage, sort, share, analyze, or delete your forms.
                  </p>
                </div>
                <div className="grid w-full gap-3 md:grid-cols-[minmax(220px,1fr)_190px_210px] xl:max-w-3xl">
                  <label className="relative">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
                    <Input
                      className="h-11 rounded-lg border-2 border-black bg-zinc-950 pl-9 font-semibold text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[2px_2px_0px_#000]"
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search forms..."
                      value={query}
                    />
                  </label>
                  <Select onValueChange={(value) => setFilterBy(value as FilterKey)} value={filterBy}>
                    <SelectTrigger className="h-11 rounded-lg border-2 border-black bg-zinc-950 font-semibold text-zinc-250 focus:ring-0 shadow-[2px_2px_0px_#000]">
                      <ListFilter className="mr-2 size-4 text-zinc-300" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(filterLabels) as FilterKey[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {filterLabels[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select onValueChange={(value) => setSortBy(value as SortKey)} value={sortBy}>
                    <SelectTrigger className="h-11 rounded-lg border-2 border-black bg-zinc-950 font-semibold text-zinc-250 focus:ring-0 shadow-[2px_2px_0px_#000]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(sortLabels) as SortKey[]).map((key) => (
                        <SelectItem key={key} value={key}>
                          {sortLabels[key]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {forms.isLoading ? (
                <StatePanel label="Loading forms" />
              ) : forms.isError ? (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
                  <AlertCircle className="size-8 text-rose-500 animate-pulse" />
                  <p className="font-flow-display text-2xl text-zinc-100">Unable to load forms</p>
                  <p className="max-w-md text-xs text-zinc-400">{forms.error.message}</p>
                </div>
              ) : visibleForms.length ? (
                <div>
                  <div className="border-b-2 border-black bg-zinc-900/85 p-5 shadow-[inset_0_-2px_0_#000]">
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="flex items-center gap-2 font-flow-display text-lg leading-none text-zinc-100 drop-shadow-[2px_2px_0px_#000]">
                          <Trash2 className="size-4 text-rose-300" />
                          Bulk Actions
                        </p>
                        <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                          Select multiple forms, then delete them together.
                        </p>
                      </div>
                      <span className="w-fit rounded-lg border-2 border-black bg-zinc-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-950 shadow-[2px_2px_0px_#000]">
                        {selectedForms.length} selected
                      </span>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="flex w-fit cursor-pointer items-center gap-3 rounded-lg border-2 border-black bg-zinc-200 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-zinc-950 shadow-[3px_3px_0px_#000] transition hover:bg-white active:scale-95">
                        <input
                          checked={allVisibleSelected}
                          className="size-5 cursor-pointer accent-zinc-950"
                          onChange={toggleVisibleForms}
                          type="checkbox"
                        />
                        <span>Select all visible forms</span>
                        <span className="rounded bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-100">
                          {selectedVisibleCount}/{visibleForms.length}
                        </span>
                      </label>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        {selectedForms.length ? (
                          <Button
                            className="h-9 rounded-lg border-2 border-black bg-zinc-900 px-3 text-[10px] font-black uppercase tracking-wider text-zinc-200 shadow-[2px_2px_0px_#000] hover:bg-zinc-800"
                            disabled={bulkDeletePending}
                            onClick={() => setSelectedFormIds([])}
                            type="button"
                            variant="outline"
                          >
                            Clear
                          </Button>
                        ) : null}
                        <Button
                          className="h-10 rounded-lg border-2 border-black bg-rose-600 px-4 text-[11px] font-black uppercase tracking-wider text-white shadow-[3px_3px_0px_#000] hover:bg-rose-500 active:scale-95 transition-all disabled:opacity-60"
                          disabled={!selectedForms.length || bulkDeletePending}
                          onClick={() => {
                            bulkRemoveForm.reset();
                            setBulkDeleteError(null);
                            setBulkDeleteOpen(true);
                          }}
                          type="button"
                        >
                          {bulkDeletePending ? <Loader2 className="size-3 animate-spin mr-1" /> : <Trash2 className="size-3 mr-1" />}
                          Delete selected
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y-2 divide-black">
                    {visibleForms.map((form, index) => {
                      const isSelected = selectedFormIds.includes(form.id);

                      return (
                        <article
                          className={`flow-dashboard-row flex flex-col gap-4 p-5 transition-all duration-200 xl:flex-row xl:items-center xl:justify-between ${isSelected ? "bg-zinc-900/70" : ""}`}
                          key={form.id}
                          style={{ animationDelay: `${320 + index * 55}ms` }}
                        >
                          <div className="flex min-w-0 items-start gap-3">
                            <input
                              aria-label={`Select ${form.title}`}
                              checked={isSelected}
                              className="mt-1 size-4 shrink-0 cursor-pointer accent-zinc-200"
                              onChange={() => toggleFormSelection(form.id)}
                              type="checkbox"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-flow-display text-lg text-zinc-100">{form.title}</p>
                              <p className="mt-1 truncate font-mono text-xs text-zinc-400 font-bold">/f/{form.slug}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 xl:ml-auto">
                            <Badge className={statusBadge(form.status)} variant="outline">
                              {form.status}
                            </Badge>
                            <Badge className={visibilityBadge(form.visibility)} variant="outline">
                              {form.visibility}
                            </Badge>
                            <span className="text-xs text-zinc-405 font-medium">
                              {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString() : "Not updated"}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 xl:justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className={`h-8 rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] hover:scale-105 active:scale-95 transition-all font-black uppercase text-[10px] tracking-wider ${isSelected ? "bg-zinc-200 text-zinc-950 hover:bg-white" : "bg-zinc-900 text-zinc-200 hover:bg-zinc-200 hover:text-zinc-950"}`}
                              onClick={() => toggleFormSelection(form.id)}
                              type="button"
                            >
                              <Check className="size-3 mr-1" />
                              {isSelected ? "Selected" : "Select"}
                            </Button>
                            <Button asChild size="sm" variant="outline" className="rounded-lg border-2 border-black bg-zinc-950 text-zinc-200 hover:bg-zinc-200 hover:text-zinc-950 shadow-[2px_2px_0px_#000] hover:scale-105 active:scale-95 transition-all h-8 font-black uppercase text-[10px] tracking-wider">
                              <Link href={`/forms/${form.id}/builder`}>
                                <Pencil className="size-3 mr-1" />
                                Builder
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline" className="rounded-lg border-2 border-black bg-zinc-950 text-zinc-200 hover:bg-zinc-200 hover:text-zinc-950 shadow-[2px_2px_0px_#000] hover:scale-105 active:scale-95 transition-all h-8 font-black uppercase text-[10px] tracking-wider">
                              <Link href={`/forms/${form.id}/results`}>
                                <BarChart3 className="size-3 mr-1" />
                                Analytics
                              </Link>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg border-2 border-black bg-zinc-950 text-zinc-200 hover:bg-zinc-200 hover:text-zinc-950 shadow-[2px_2px_0px_#000] hover:scale-105 active:scale-95 transition-all h-8 font-black uppercase text-[10px] tracking-wider"
                              onClick={() => {
                                const url = `${window.location.origin}/f/${form.slug}`;
                                void navigator.clipboard.writeText(url);
                                setCopiedFormId(form.id);
                                setTimeout(() => setCopiedFormId(null), 2000);
                              }}
                            >
                              {copiedFormId === form.id ? <Check className="size-3 mr-1" /> : <Copy className="size-3 mr-1" />}
                              Share
                            </Button>
                            {form.status === "published" ? (
                              <Button asChild size="sm" className="rounded-lg border-2 border-black bg-zinc-200 text-zinc-950 hover:bg-white shadow-[2px_2px_0px_#000] hover:scale-105 active:scale-95 transition-all h-8 font-black uppercase text-[10px] tracking-wider">
                                <Link href={`/f/${form.slug}`} target="_blank">
                                  <ExternalLink className="size-3 mr-1" />
                                  Live
                                </Link>
                              </Button>
                            ) : null}
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg border-2 border-rose-600 bg-rose-950/40 text-rose-250 hover:bg-rose-600 hover:text-white shadow-[2px_2px_0px_#000] hover:scale-105 active:scale-95 transition-all h-8 font-black uppercase text-[10px] tracking-wider"
                              disabled={(removeForm.isPending && deleteTarget?.id === form.id) || bulkDeletePending}
                              onClick={() => {
                                removeForm.reset();
                                setDeleteTarget(form);
                              }}
                            >
                              {removeForm.isPending && deleteTarget?.id === form.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : (
                                <Trash2 className="size-3 mr-1" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center">
                  <FilePlus2 className="size-8 text-zinc-500" />
                  <p className="font-flow-display text-2xl text-zinc-200">No forms found</p>
                  <p className="max-w-sm text-xs leading-relaxed text-zinc-500">
                    Create a new form or adjust your search, filter, or sorting controls.
                  </p>
                </div>
              )}
            </section>
          </section>
        </div>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-xl border-2 border-black bg-zinc-950 text-zinc-250 shadow-[6px_6px_0px_#000] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-flow-display text-xl leading-none text-white drop-shadow-[2px_2px_0px_#000]">
              Delete this form?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed text-zinc-400">
              This will permanently delete{" "}
              <span className="font-semibold text-zinc-200">{deleteTarget?.title ?? "this form"}</span>,
              including its fields, public link, responses, and analytics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {removeForm.error ? (
            <div className="rounded-lg border-2 border-rose-600 bg-rose-950/20 p-3 text-xs text-rose-455">
              {removeForm.error.message}
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg border-2 border-black bg-zinc-900 text-zinc-205 hover:bg-zinc-800 hover:text-white text-xs shadow-[2px_2px_0px_#000] transition-all">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg bg-rose-600 text-white hover:bg-rose-500 text-xs border-2 border-black shadow-[3px_3px_0px_#000] transition-all hover:scale-105 active:scale-95 font-black uppercase tracking-wider"
              disabled={removeForm.isPending}
              onClick={(event) => {
                event.preventDefault();
                if (!deleteTarget) return;
                removeForm.mutate({ formId: deleteTarget.id });
              }}
            >
              {removeForm.isPending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Trash2 className="size-3.5 mr-1" />}
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => {
          if (!bulkDeletePending) setBulkDeleteOpen(open);
        }}
      >
        <AlertDialogContent className="rounded-xl border-2 border-black bg-zinc-950 text-zinc-250 shadow-[6px_6px_0px_#000] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-flow-display text-xl leading-none text-white drop-shadow-[2px_2px_0px_#000]">
              Delete selected forms?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-relaxed text-zinc-400">
              This will permanently delete {selectedForms.length} selected form{selectedForms.length === 1 ? "" : "s"},
              including fields, public links, responses, and analytics.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-lg border-2 border-black bg-zinc-900 p-3 shadow-[2px_2px_0px_#000]">
            <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-zinc-500">
              Selected campaigns
            </p>
            <div className="space-y-1.5">
              {selectedForms.slice(0, 4).map((form) => (
                <p className="truncate text-xs font-semibold text-zinc-250" key={form.id}>
                  {form.title}
                </p>
              ))}
              {selectedForms.length > 4 ? (
                <p className="text-xs font-semibold text-zinc-500">
                  +{selectedForms.length - 4} more
                </p>
              ) : null}
            </div>
          </div>

          {bulkDeleteError ? (
            <div className="rounded-lg border-2 border-rose-600 bg-rose-950/20 p-3 text-xs text-rose-455">
              {bulkDeleteError}
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel
              className="rounded-lg border-2 border-black bg-zinc-900 text-zinc-205 hover:bg-zinc-800 hover:text-white text-xs shadow-[2px_2px_0px_#000] transition-all"
              disabled={bulkDeletePending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg bg-rose-600 text-white hover:bg-rose-500 text-xs border-2 border-black shadow-[3px_3px_0px_#000] transition-all hover:scale-105 active:scale-95 font-black uppercase tracking-wider"
              disabled={bulkDeletePending || !selectedForms.length}
              onClick={(event) => {
                event.preventDefault();
                void deleteSelectedForms();
              }}
            >
              {bulkDeletePending ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Trash2 className="size-3.5 mr-1" />}
              Delete selected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function Metric({
  icon,
  index,
  label,
  value,
}: {
  icon: React.ReactNode;
  index: number;
  label: string;
  value: number;
}) {
  const rotationClass = useMemo(() => {
    switch (index % 4) {
      case 0: return "rotate-1 hover:rotate-0";
      case 1: return "-rotate-1 hover:rotate-0";
      case 2: return "rotate-[1.5deg] hover:rotate-0";
      case 3:
      default:
        return "-rotate-[0.5deg] hover:rotate-0";
    }
  }, [index]);

  return (
    <div
      className={`flow-dashboard-metric rounded-xl border-2 border-black bg-zinc-950 px-4 py-4 shadow-[4px_4px_0px_#000] hover:scale-[1.04] active:scale-97 transition-all duration-200 cursor-default ${rotationClass} hover:bg-zinc-900/60`}
      style={{ animationDelay: `${120 + index * 70}ms` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 border-2 border-black shadow-[2px_2px_0px_#000]">
          {icon}
        </span>
      </div>
      <p className="mt-4 font-flow-display text-3xl leading-none text-zinc-100">{value}</p>
    </div>
  );
}

function StatePanel({ label }: { label: string }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="flex items-center gap-3 text-xs font-semibold text-zinc-405">
        <Loader2 className="size-4.5 animate-spin text-zinc-300" />
        {label}
      </div>
    </div>
  );
}

function DashboardLoading({ label }: { label: string }) {
  return (
    <main className="theme-flowform-kingdom flex min-h-screen items-center justify-center text-zinc-200">
      <div className="flex items-center rounded-xl border-2 border-black bg-zinc-950 px-6 py-4 shadow-[5px_5px_0px_#000]">
        <Loader2 className="mr-3 size-5 animate-spin text-zinc-300" />
        <span className="font-flow-display text-lg text-zinc-100 tracking-wide">{label}</span>
      </div>
    </main>
  );
}

function AuthScreen() {
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("FlowForm User");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onAuthSuccess = async (user: AuthUser) => {
    utils.auth.me.setData(undefined, user);
    await utils.forms.list.invalidate();
  };

  const login = trpc.auth.login.useMutation({ onSuccess: onAuthSuccess });
  const register = trpc.auth.register.useMutation({ onSuccess: onAuthSuccess });
  const isRegister = mode === "register";
  const isPending = login.isPending || register.isPending;
  const error = login.error ?? register.error;

  return (
    <main className="flow-auth-bg relative min-h-screen overflow-hidden text-zinc-200 selection:bg-zinc-800 selection:text-white">
      <div className="absolute inset-0 bg-zinc-950 theme-flowform-kingdom" />
      <header className="relative z-20 border-b-2 border-black bg-zinc-950/80 backdrop-blur-md shadow-[3px_3px_0px_#000]">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link
            className="font-flow-display text-2xl font-black uppercase tracking-tight text-white drop-shadow-[2px_2px_0px_#000] hover:scale-105 active:scale-95 transition-all inline-block"
            href="/"
          >
            FlowForm
          </Link>
          <Button
            className="h-10 rounded-lg bg-zinc-200 hover:bg-white text-zinc-950 text-xs font-black uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_#000] transition-all hover:scale-105 active:scale-95"
            onClick={() => setMode(isRegister ? "login" : "register")}
            type="button"
          >
            {isRegister ? "Sign In" : "Sign Up"}
          </Button>
        </div>
      </header>

      <section className="relative z-10 flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-[520px]">
          <div className="relative z-10 rounded-xl border-2 border-black bg-zinc-950 px-6 pb-8 pt-10 shadow-[8px_8px_0px_#000] sm:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-flow-display tracking-tight text-white drop-shadow-[2px_2px_0px_#000]">
                {isRegister ? "Create Account" : "Welcome Back"}
              </h2>
              <p className="text-xs text-zinc-400 mt-2 font-bold uppercase tracking-wider">
                {isRegister ? "Build high-converting forms in seconds." : "Log in to your visual form panel."}
              </p>
            </div>

            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                if (isRegister) {
                  if (!acceptedTerms) return;
                  register.mutate({ fullName, email, password });
                  return;
                }
                login.mutate({ email, password });
              }}
            >
              {isRegister ? (
                <AuthField
                  icon={<UserPlus className="size-4" />}
                  label="Full Name"
                >
                  <Input
                    className="h-11 rounded-lg border-2 border-black bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[3px_3px_0px_#000]"
                    maxLength={80}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    value={fullName}
                  />
                </AuthField>
              ) : null}

              <AuthField icon={<ScrollText className="size-4" />} label="Email Address">
                <Input
                  className="h-11 rounded-lg border-2 border-black bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[3px_3px_0px_#000]"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@company.com"
                  required
                  type="email"
                  value={email}
                />
              </AuthField>

              <AuthField icon={<Lock className="size-4" />} label="Password">
                <div className="relative">
                  <Input
                    className="h-11 rounded-lg border-2 border-black bg-zinc-950 text-sm text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-0 focus-visible:border-zinc-400 shadow-[3px_3px_0px_#000]"
                    minLength={isRegister ? 8 : 1}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                    onClick={() => setShowPassword((current) => !current)}
                    type="button"
                  >
                    <Eye className="size-4.5" />
                  </button>
                </div>
              </AuthField>

              {isRegister ? (
                <label className="flex items-start gap-3 text-xs leading-normal text-zinc-450 cursor-pointer font-semibold uppercase tracking-wider">
                  <input
                    checked={acceptedTerms}
                    className="mt-0.5 size-4 rounded border-2 border-black bg-zinc-950 text-zinc-200 focus:ring-0 cursor-pointer shadow-[1px_1px_0px_#000]"
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    I agree to the{" "}
                    <Link className="text-zinc-200 hover:underline font-bold" href="/pricing">
                      Terms of Service
                    </Link>{" "}
                    and acknowledge the{" "}
                    <Link className="text-zinc-200 hover:underline font-bold" href="/explore">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              ) : null}

              <Button
                className="h-11 w-full rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_#000] hover:bg-white active:scale-95 transition-all hover:scale-[1.02] hover:-rotate-1"
                disabled={isPending || (isRegister && !acceptedTerms)}
              >
                {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <ArrowRight className="size-4 mr-2" />}
                {isRegister ? "Create Account" : "Sign In"}
              </Button>

              <div className="text-center text-xs text-zinc-450 mt-4 font-semibold uppercase tracking-wider">
                {isRegister ? "Already have an account?" : "Need a new account?"}{" "}
                <button
                  className="font-bold text-zinc-200 hover:underline transition"
                  onClick={() => setMode(isRegister ? "login" : "register")}
                  type="button"
                >
                  {isRegister ? "Sign In" : "Sign Up"}
                </button>
              </div>

              <Button
                className="h-10 w-full rounded-lg border-2 border-black bg-zinc-900 text-xs font-black uppercase tracking-wider text-zinc-200 shadow-[3px_3px_0px_#000] hover:bg-zinc-800 active:scale-95 transition-all hover:scale-[1.02] hover:rotate-1"
                onClick={() => {
                  setMode("login");
                  setEmail("judge@flowform.io");
                  setPassword("spider-sense-2026");
                }}
                type="button"
                variant="outline"
              >
                Use Judge Demo Pass
              </Button>

              {error ? (
                <div className="flex items-start gap-2.5 rounded-lg border-2 border-rose-600 bg-rose-950/20 p-3.5 text-xs text-rose-455">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
                  <p>{error.message}</p>
                </div>
              ) : null}
            </form>

            <div className="mt-6 border-t border-zinc-900 pt-5">
              <div className="mx-auto grid max-w-sm grid-cols-2 gap-3">
                <AuthPill icon={<ShieldCheck className="size-3.5" />} label="Secure Data" />
                <AuthPill icon={<CloudSyncIcon />} label="Realtime Sync" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthField({
  children,
  icon,
  label,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-2 text-xs font-bold text-zinc-400">
        <span className="text-zinc-300">{icon}</span>
        {label}
      </span>
      {children}
    </label>
  );
}

function AuthPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex h-9 items-center justify-center gap-2 rounded-lg border-2 border-black bg-zinc-900 text-[11px] font-black uppercase tracking-wider text-zinc-200 shadow-[2px_2px_0px_#000]">
      {icon}
      {label}
    </div>
  );
}

function CloudSyncIcon() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
      <path d="M7 18h10a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.2 8.1 5 5 0 0 0 7 18Z" />
      <path d="m9 13 2 2 4-4" />
    </svg>
  );
}
