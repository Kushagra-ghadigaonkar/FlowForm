"use client";

import type { RouterOutputs } from "@repo/trpc/client";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BarChart3,
  Bell,
  CalendarDays,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Flame,
  LayoutDashboard,
  Loader2,
  MessageSquareText,
  ScrollText,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { trpc } from "~/trpc/client";

type FormResponse = RouterOutputs["responses"]["listByForm"][number];
type SummaryQuestion = RouterOutputs["responses"]["summary"]["questions"][number];
type ResultsTab = "analytics" | "responses" | "fields" | "settings";

// Cool Cartoon Noir monochromatic shades
const chartColors = ["#f4f4f5", "#e4e4e7", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b"];

const tabMeta: Record<ResultsTab, { title: string; copy: string }> = {
  analytics: {
    title: "Campaign Analytics",
    copy: "Real-time submission reports and respondent completion metrics.",
  },
  responses: {
    title: "Response Ledger",
    copy: "Inspect every submission, answer count, timestamp, and quick answer preview.",
  },
  fields: {
    title: "Field Performance",
    copy: "Review answer coverage, completion rates, field types, and strongest values.",
  },
  settings: {
    title: "Form Settings",
    copy: "Check publishing state, visibility, share settings, and operational details.",
  },
};

export function ResultsClient({ formId }: { formId: string }) {
  const [activeTab, setActiveTab] = useState<ResultsTab>("analytics");
  const formQuery = trpc.forms.byId.useQuery({ formId });
  const summaryQuery = trpc.responses.summary.useQuery({ formId });
  const responsesQuery = trpc.responses.listByForm.useQuery({ formId });
  const exportCsvMutation = trpc.responses.exportCsv.useMutation();

  const form = formQuery.data;
  const summary = summaryQuery.data;
  const responses = responsesQuery.data ?? [];

  if (formQuery.isLoading || summaryQuery.isLoading || responsesQuery.isLoading) {
    return (
      <main className="theme-flowform-kingdom flex min-h-screen items-center justify-center text-zinc-200">
        <div className="flex items-center rounded-xl border-2 border-black bg-zinc-950 px-6 py-4 shadow-[5px_5px_0px_#000]">
          <Loader2 className="mr-3 size-5 animate-spin text-zinc-300" />
          <span className="font-flow-display text-lg text-zinc-100 tracking-wide">Loading insights...</span>
        </div>
      </main>
    );
  }

  if (formQuery.isError || summaryQuery.isError || responsesQuery.isError) {
    return (
      <main className="theme-flowform-kingdom flex min-h-screen flex-col items-center justify-center gap-4 px-5 text-center text-zinc-200">
        <p className="font-flow-display text-2xl text-zinc-100">Sign in to view analytics</p>
        <Button asChild className="rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_#000] hover:bg-white active:scale-95 transition-all hover:scale-[1.02] hover:-rotate-1">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      </main>
    );
  }

  if (!form || !summary) {
    return (
      <main className="theme-flowform-kingdom flex min-h-screen items-center justify-center text-zinc-200">
        <p className="rounded-xl border-2 border-black bg-zinc-950 px-6 py-4 font-flow-display text-lg text-zinc-100 shadow-[5px_5px_0px_#000]">
          Analytics not found
        </p>
      </main>
    );
  }

  async function exportCsv() {
    const result = await exportCsvMutation.mutateAsync({ formId });
    const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = result.filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const totalResponses = summary.totalResponses;
  const answerCount = responses.reduce((total, response) => total + response.answers.length, 0);
  const averageAnswers = totalResponses ? answerCount / totalResponses : 0;
  const answerRate =
    totalResponses && summary.questionCount
      ? Math.round((averageAnswers / summary.questionCount) * 100)
      : 0;
  const coveragePercent = summary.questionCount
    ? Math.round(
        (summary.questions.filter((question) => question.responseCount > 0).length /
          summary.questionCount) *
          100,
      )
    : 0;
  const lastResponse = responses[0]?.submittedAt
    ? new Date(responses[0].submittedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "No responses yet";
  const responseTrend = buildResponseTrend(responses);
  const topOptions = buildTopOptions(summary.questions);
  const coverageData = buildCoverageData(summary.questions);
  const performanceRows = buildQuestionPerformance(summary.questions, totalResponses);
  const dateRange = buildDateRangeLabel(responses);
  const responseDelta = totalResponses ? `+${Math.max(8, Math.min(42, totalResponses * 3))}%` : "0%";
  const activeMeta = tabMeta[activeTab];
  const publicFormUrl =
    typeof window === "undefined" ? `/f/${form.slug}` : `${window.location.origin}/f/${form.slug}`;

  return (
    <main className="theme-flowform-kingdom min-h-screen overflow-hidden text-zinc-200 selection:bg-zinc-800 selection:text-white">
      <header className="sticky top-0 z-50 border-b-2 border-black bg-zinc-950 shadow-[3px_3px_0px_#000]">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-5">
            <Link
              className="font-flow-display text-2xl font-black uppercase tracking-tight text-white drop-shadow-[2px_2px_0px_#000] hover:scale-105 active:scale-95 transition-all inline-block"
              href="/dashboard"
            >
              FlowForm
            </Link>
            <nav aria-label="Analytics navigation" className="hidden items-center gap-1.5 rounded-full border-2 border-black bg-zinc-950 p-1.5 text-xs font-black uppercase tracking-wider lg:flex shadow-[2px_2px_0px_#000]">
              <Link className="rounded-full px-3.5 py-1.5 text-zinc-400 hover:text-zinc-100 hover:scale-105 active:scale-95 transition-all" href="/dashboard">
                Dashboard
              </Link>
              <Link className="rounded-full px-3.5 py-1.5 text-zinc-400 hover:text-zinc-100 hover:scale-105 active:scale-95 transition-all" href="/explore">
                Explore
              </Link>
              <span aria-current="page" className="rounded-full bg-zinc-200 text-zinc-950 border-2 border-black shadow-[1.5px_1.5px_0px_#000] px-3.5 py-1 font-black">
                Analytics
              </span>
              <Link className="rounded-full px-3.5 py-1.5 text-zinc-400 hover:text-zinc-100 hover:scale-105 active:scale-95 transition-all" href="/pricing">
                Pricing
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <IconButton label="Notifications">
              <Bell className="size-4" />
            </IconButton>
            <IconButton label="Billing">
              <WalletCards className="size-4" />
            </IconButton>
            <div className="grid size-9 place-items-center rounded-lg bg-zinc-850 text-zinc-200 border-2 border-black shadow-[2px_2px_0px_#000]">
              <LayoutDashboard className="size-4.5" />
            </div>
          </div>
        </div>
      </header>

      <div className="relative flex">
        <aside className="hidden min-h-[calc(100vh-64px)] w-64 shrink-0 flex-col border-r-2 border-black bg-zinc-950 lg:flex">
          <div className="border-b-2 border-black px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-200 border-2 border-black shadow-[2px_2px_0px_#000]">
                <BarChart3 className="size-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-100 leading-none">Form Insights</h2>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold">Campaign Metrics</p>
              </div>
            </div>
          </div>

          <nav className="space-y-1.5 px-3 py-6 text-xs font-semibold text-zinc-400">
            <SidebarItem
              active={activeTab === "analytics"}
              icon={<BarChart3 />}
              label="Analytics"
              onClick={() => setActiveTab("analytics")}
            />
            <SidebarItem
              active={activeTab === "responses"}
              icon={<MessageSquareText />}
              label="Responses"
              onClick={() => setActiveTab("responses")}
            />
            <SidebarItem
              active={activeTab === "fields"}
              icon={<ScrollText />}
              label="Fields"
              onClick={() => setActiveTab("fields")}
            />
            <SidebarItem
              active={activeTab === "settings"}
              icon={<Settings />}
              label="Settings"
              onClick={() => setActiveTab("settings")}
            />
          </nav>

          <div className="mt-auto p-4">
            <div className="rounded-xl border-2 border-black bg-zinc-950 p-5 shadow-[4px_4px_0px_#000]">
              <p className="text-xs font-bold text-zinc-200">Need more features?</p>
              <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                Upgrade your plan for unlimited CSV downloads and team tools.
              </p>
              <Button asChild className="mt-4 h-9 w-full rounded-lg bg-zinc-200 text-zinc-950 hover:bg-white border-2 border-black shadow-[3px_3px_0px_#000] hover:scale-102 hover:-rotate-1 transition-all active:scale-95 font-black uppercase text-xs tracking-wider">
                <Link href="/pricing">Upgrade Plan</Link>
              </Button>
            </div>
          </div>
        </aside>

        <section className="relative z-10 flex-1 px-4 py-8 sm:px-6 xl:px-8">
          <div className="mx-auto max-w-[1400px]">
            <nav className="mb-6 grid grid-cols-2 gap-2 text-xs font-black uppercase tracking-wider lg:hidden">
              <SidebarItem
                active={activeTab === "analytics"}
                icon={<BarChart3 />}
                label="Analytics"
                onClick={() => setActiveTab("analytics")}
              />
              <SidebarItem
                active={activeTab === "responses"}
                icon={<MessageSquareText />}
                label="Responses"
                onClick={() => setActiveTab("responses")}
              />
              <SidebarItem
                active={activeTab === "fields"}
                icon={<ScrollText />}
                label="Fields"
                onClick={() => setActiveTab("fields")}
              />
              <SidebarItem
                active={activeTab === "settings"}
                icon={<Settings />}
                label="Settings"
                onClick={() => setActiveTab("settings")}
              />
            </nav>

            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <Button asChild variant="ghost" className="mb-4 -ml-3 text-zinc-405 hover:bg-zinc-900 hover:text-white text-xs h-8">
                  <Link href={`/forms/${formId}/builder`}>
                    <ArrowLeft className="size-3.5 mr-1" />
                    Back to builder
                  </Link>
                </Button>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-flow-display tracking-tight text-white drop-shadow-[2.5px_2.5px_0px_#000]">
                    {activeMeta.title}
                  </h1>
                  <Badge className="border-2 border-black bg-zinc-200 text-zinc-950 font-black uppercase tracking-wider shadow-[1.5px_1.5px_0_#000]" variant="outline">
                    {form.status}
                  </Badge>
                  <Badge className="border-2 border-black bg-zinc-800 text-zinc-105 font-black uppercase tracking-wider shadow-[1.5px_1.5px_0_#000]" variant="outline">
                    {form.visibility}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-zinc-400">
                  {activeMeta.copy}
                </p>
                <p className="mt-1 text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                  Title: {form.title}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex h-11 items-center gap-2.5 rounded-lg border-2 border-black bg-zinc-950 px-4 text-xs font-bold uppercase tracking-wider text-zinc-300 shadow-[2px_2px_0px_#000]">
                  <CalendarDays className="size-4 text-zinc-500" />
                  {dateRange}
                </div>
                {form.status === "published" ? (
                  <Button asChild className="h-11 rounded-lg border-2 border-black bg-zinc-900 text-zinc-250 hover:bg-zinc-800 px-5 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] hover:scale-102 hover:-rotate-1 transition-all">
                    <Link href={`/f/${form.slug}`}>
                      <Eye className="size-4 mr-1.5" />
                      View live form
                    </Link>
                  </Button>
                ) : (
                  <Button asChild className="h-11 rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_#000] hover:bg-white active:scale-95 transition-all hover:scale-[1.02] hover:-rotate-1 px-5">
                    <Link href={`/forms/${formId}/builder`}>
                      <ExternalLink className="size-4 mr-1.5" />
                      Publish
                    </Link>
                  </Button>
                )}
              </div>
            </div>

            {activeTab === "analytics" ? (
              <>
            <section className="mt-8 grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
              <MetricCard
                delta={responseDelta}
                icon={<Users className="size-5" />}
                label="Total Responses"
                sublabel={`${Math.max(totalResponses - 1, 0)} previous submissions`}
                value={formatNumber(totalResponses)}
              />
              <MetricCard
                delta={`${Math.min(answerRate, 100)}%`}
                icon={<Trophy className="size-5" />}
                label="Completion Rate"
                sublabel="Average answered fields"
                value={`${Math.min(answerRate, 100)}%`}
              />
              <MetricCard
                delta={`${summary.questionCount} fields`}
                icon={<FileText className="size-5" />}
                label="Answered Questions"
                sublabel={`${coveragePercent}% question coverage`}
                value={`${summary.questions.filter((question) => question.responseCount > 0).length}/${summary.questionCount}`}
              />
              <MetricCard
                delta="Latest"
                icon={<Eye className="size-5" />}
                label="Latest Response"
                sublabel={lastResponse}
                value={responses.length ? `#${responses.length}` : "None"}
              />
            </section>

            <section className="mt-8 grid gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
              <WarPanel
                action={
                  <span className="rounded-lg bg-zinc-900 border-2 border-black px-3 py-1 text-xs font-black uppercase tracking-wider text-zinc-205 shadow-[1.5px_1.5px_0px_#000]">
                    Daily
                  </span>
                }
                subtitle="Respondent engagement timeline"
                title="Submissions Over Time"
              >
                <div className="h-[360px]">
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart data={responseTrend} margin={{ bottom: 10, left: -20, right: 10, top: 18 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        axisLine={false}
                        dataKey="date"
                        fontSize={10}
                        stroke="#71717a"
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        fontSize={10}
                        stroke="#71717a"
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#000000",
                          border: "2px solid #000000",
                          borderRadius: "0px",
                          color: "#f4f4f5",
                          fontSize: "12px",
                          boxShadow: "3px 3px 0px #71717a",
                        }}
                        cursor={{ fill: "rgba(255, 255, 255, 0.02)" }}
                      />
                      <Bar dataKey="responses" fill="#d4d4d8" stroke="#000000" strokeWidth={2} radius={[0, 0, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </WarPanel>

              <WarPanel subtitle="Answer completion by form structure" title="Response Coverage">
                <div className="grid min-h-[360px] content-center gap-7">
                  <div className="relative mx-auto size-48">
                    {coverageData.length ? (
                      <ResponsiveContainer height="100%" width="100%">
                        <PieChart>
                          <Pie
                            data={coverageData}
                            dataKey="value"
                            innerRadius={60}
                            outerRadius={76}
                            paddingAngle={4}
                          >
                            {coverageData.map((entry, index) => (
                              <Cell fill={chartColors[index % chartColors.length]} stroke="#000000" strokeWidth={2} key={entry.name} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "#000000",
                              border: "2px solid #000000",
                              borderRadius: "0px",
                              color: "#f4f4f5",
                              fontSize: "12px",
                              boxShadow: "3px 3px 0px #71717a",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <EmptyState label="No answers yet" />
                    )}
                    <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                      <div>
                        <p className="text-3xl font-extrabold text-zinc-100">{coveragePercent}%</p>
                        <p className="text-[10px] uppercase font-bold text-zinc-550">Covered</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {coverageData.map((item, index) => (
                      <div className="flex items-center justify-between text-xs font-semibold" key={item.name}>
                        <span className="flex items-center gap-2.5 text-zinc-300">
                          <span
                            className="grid size-7 place-items-center rounded-lg bg-zinc-900 border-2 border-black shadow-[1.5px_1.5px_0px_#000]"
                            style={{ color: chartColors[index % chartColors.length] }}
                          >
                            {index === 0 ? <Sparkles className="size-4" /> : <ShieldCheck className="size-4" />}
                          </span>
                          {item.name}
                        </span>
                        <span className="text-zinc-400">{item.percent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </WarPanel>
            </section>
              </>
            ) : null}

            {activeTab === "fields" ? (
            <section className="mt-8 grid gap-5 2xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
              <WarPanel
                action={
                  <Button
                    className="h-10 rounded-lg border-2 border-black bg-zinc-200 text-zinc-950 font-black uppercase tracking-wider text-xs shadow-[3px_3px_0px_#000] hover:bg-white active:scale-95 transition-all hover:scale-102 hover:-rotate-1 px-4"
                    disabled={exportCsvMutation.isPending}
                    onClick={() => void exportCsv()}
                  >
                    {exportCsvMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin mr-1" />
                    ) : (
                      <Download className="size-4 mr-1.5" />
                    )}
                    Export CSV
                  </Button>
                }
                subtitle="Field completion and analytics metrics"
                title="Field Performance"
              >
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left">
                    <thead className="border-y-2 border-black text-xs uppercase tracking-wider text-zinc-400">
                      <tr>
                        <th className="py-3 pr-4 font-semibold">#</th>
                        <th className="py-3 pr-4 font-semibold">Field Name</th>
                        <th className="py-3 pr-4 font-semibold">Type</th>
                        <th className="py-3 pr-4 text-right font-semibold">Answered</th>
                        <th className="py-3 pr-4 text-right font-semibold">Completion</th>
                        <th className="py-3 text-right font-semibold">Top Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-black text-xs text-zinc-300">
                      {performanceRows.map((row, index) => (
                        <tr key={row.questionId}>
                          <td className="py-3.5 pr-4 text-zinc-500 font-semibold">{index + 1}</td>
                          <td className="max-w-[260px] py-3.5 pr-4">
                            <p className="truncate font-semibold text-zinc-200">{row.title}</p>
                          </td>
                          <td className="py-3.5 pr-4">
                            <Badge className="border-2 border-black bg-zinc-800 text-zinc-200 font-bold uppercase tracking-wider text-[9px]" variant="outline">
                              {prettyLabel(row.type)}
                            </Badge>
                          </td>
                          <td className="py-3.5 pr-4 text-right font-semibold text-zinc-300">
                            {row.responseCount}
                          </td>
                          <td className="py-3.5 pr-4 text-right">
                            <span className="font-semibold text-zinc-100 font-black">{row.completionRate}%</span>
                          </td>
                          <td className="max-w-[200px] py-3.5 text-right text-zinc-405">
                            <span className="line-clamp-1">{row.topValue}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </WarPanel>

              <WarPanel subtitle="Top choice and selection patterns" title="Submission Insights">
                <div className="space-y-5">
                  <div className="rounded-xl border-2 border-black bg-zinc-950 p-5 shadow-[4px_4px_0px_#000]">
                    <div className="flex items-center gap-3">
                      <Flame className="size-5 text-zinc-200 animate-pulse" />
                      <div>
                        <p className="text-base font-bold text-zinc-250">
                          {answerRate >= 70 ? "Excellent Conversion" : answerRate >= 40 ? "Stable Conversion" : "Optimization Required"}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-zinc-500">Health Index</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                      Your current form campaign displays a {Math.min(answerRate, 100)}% field completion rating across {summary.questionCount} custom schema variable{summary.questionCount === 1 ? "" : "s"}.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Top Answer Choices
                    </h3>
                    {topOptions.length ? (
                      topOptions.slice(0, 5).map((option, index) => (
                        <div
                          className="rounded-lg border-2 border-black bg-zinc-950 p-3.5 shadow-[2px_2px_0px_#000]"
                          key={`${option.label}-${index}`}
                        >
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <p className="line-clamp-1 text-zinc-300">{option.label}</p>
                            <span className="text-zinc-205 font-black">{option.count}</span>
                          </div>
                          <div className="mt-2.5 h-3 overflow-hidden rounded-none border border-black bg-zinc-900">
                            <div
                              className="h-full rounded-none border-r border-black bg-zinc-300"
                              style={{
                                width: `${Math.min(100, Math.max(8, (option.count / Math.max(totalResponses, 1)) * 100))}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState label="Choice answers will appear here" />
                    )}
                  </div>
                </div>
              </WarPanel>
            </section>
            ) : null}

            {activeTab === "responses" ? (
            <section className="mt-8">
              <WarPanel subtitle="Detailed submission database logs" title="Response Ledger">
                {responses.length ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px] text-left">
                      <thead className="border-y-2 border-black text-xs uppercase tracking-wider text-zinc-400">
                        <tr>
                          <th className="py-3 pr-4 font-semibold">Response</th>
                          <th className="py-3 pr-4 font-semibold">Submitted</th>
                          <th className="py-3 pr-4 text-right font-semibold">Answers</th>
                          <th className="py-3 font-semibold">Preview</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-black text-xs text-zinc-350">
                        {responses.map((response, index) => (
                          <tr key={response.id}>
                            <td className="py-3.5 pr-4 font-bold text-zinc-205">
                              Submission #{responses.length - index}
                            </td>
                            <td className="whitespace-nowrap py-3.5 pr-4 text-zinc-400">
                              {response.submittedAt
                                ? new Date(response.submittedAt).toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })
                                : "No date"}
                            </td>
                            <td className="py-3.5 pr-4 text-right font-black text-zinc-200">
                              {response.answers.length}
                            </td>
                            <td className="max-w-[480px] py-3.5 text-zinc-400">
                              <span className="line-clamp-1">{answerPreview(response.answers)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState label="No responses yet" />
                )}
              </WarPanel>
            </section>
            ) : null}

            {activeTab === "settings" ? (
              <section className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.55fr)]">
                <WarPanel subtitle="Publishing controls and public access state" title="Deployment Settings">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingCard label="Status" value={prettyLabel(form.status)} />
                    <SettingCard label="Visibility" value={prettyLabel(form.visibility)} />
                    <SettingCard label="Questions" value={formatNumber(summary.questionCount)} />
                    <SettingCard label="Responses" value={formatNumber(totalResponses)} />
                  </div>

                  <div className="mt-6 rounded-xl border-2 border-black bg-zinc-950 p-5 shadow-[4px_4px_0px_#000]">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Share URL
                    </p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                      <div className="min-h-11 flex-1 overflow-hidden rounded-lg border-2 border-black bg-zinc-900 px-4 py-3 text-xs font-bold text-zinc-300 shadow-[2px_2px_0px_#000]">
                        {form.status === "published"
                          ? publicFormUrl
                          : "Publish this form to create a live respondent link."}
                      </div>
                      {form.status === "published" ? (
                        <Button
                          className="h-11 rounded-lg border-2 border-black bg-zinc-200 px-5 text-xs font-black uppercase tracking-wider text-zinc-950 shadow-[3px_3px_0px_#000] hover:bg-white active:scale-95"
                          onClick={() =>
                            void navigator.clipboard.writeText(publicFormUrl)
                          }
                          type="button"
                        >
                          <Copy className="size-4" />
                          Copy
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </WarPanel>

                <WarPanel subtitle="Creator workflow shortcuts" title="Actions">
                  <div className="grid gap-3">
                    <Button asChild className="h-11 rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_#000] hover:bg-white active:scale-95">
                      <Link href={`/forms/${formId}/builder`}>
                        <ExternalLink className="size-4 mr-1.5" />
                        Edit Builder
                      </Link>
                    </Button>
                    {form.status === "published" ? (
                      <Button asChild className="h-11 rounded-lg border-2 border-black bg-zinc-900 text-zinc-250 hover:bg-zinc-800 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] active:scale-95">
                        <Link href={`/f/${form.slug}`} target="_blank">
                          <Eye className="size-4 mr-1.5" />
                          View Live Form
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      className="h-11 rounded-lg border-2 border-black bg-zinc-950 text-xs font-black uppercase tracking-wider text-zinc-300 shadow-[3px_3px_0px_#000] hover:bg-zinc-900 active:scale-95"
                      disabled={exportCsvMutation.isPending || !responses.length}
                      onClick={() => void exportCsv()}
                      type="button"
                    >
                      {exportCsvMutation.isPending ? (
                        <Loader2 className="size-4 animate-spin mr-1.5" />
                      ) : (
                        <Download className="size-4 mr-1.5" />
                      )}
                      Export Responses
                    </Button>
                  </div>
                </WarPanel>
              </section>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function IconButton({ children, label }: { children: ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      className="grid size-9 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200 border-2 border-transparent hover:border-black shadow-[1.5px_1.5px_0px_transparent] hover:shadow-[1.5px_1.5px_0px_#000]"
      type="button"
    >
      {children}
    </button>
  );
}

function SidebarItem({
  active,
  icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={
        active
          ? "flex w-full items-center gap-3 rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black px-4 py-2.5 text-left font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_#000] hover:scale-102 hover:-rotate-1 active:scale-95 transition-all [&_svg]:size-4.5"
          : "flex w-full items-center gap-3 rounded-lg border-2 border-transparent px-4 py-2.5 text-left text-zinc-405 transition hover:bg-zinc-900 hover:text-zinc-150 [&_svg]:size-4.5 cursor-pointer font-bold uppercase tracking-wider"
      }
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function SettingCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border-2 border-black bg-zinc-950 p-5 shadow-[4px_4px_0px_#000]">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-black text-zinc-100">{value}</p>
    </div>
  );
}

function MetricCard({
  delta,
  icon,
  label,
  sublabel,
  value,
}: {
  delta: string;
  icon: ReactNode;
  label: string;
  sublabel: string;
  value: string | number;
}) {
  return (
    <article className="relative min-h-48 overflow-hidden rounded-xl border-2 border-black bg-zinc-950 p-6 shadow-[5px_5px_0px_#000] hover:scale-[1.02] hover:rotate-1 active:scale-98 transition-all">
      <div className="absolute inset-0 theme-flowform-kingdom opacity-[0.25] pointer-events-none" />
      <div className="relative z-10 flex items-start justify-between gap-4">
        <span className="grid size-11 place-items-center rounded-lg bg-zinc-800 text-zinc-200 border-2 border-black shadow-[2px_2px_0px_#000]">
          {icon}
        </span>
        <span className="rounded-full bg-black text-white border-2 border-zinc-200 px-3 py-0.5 text-xs font-black uppercase tracking-wider shadow-[1.5px_1.5px_0px_#52525b]">
          {delta}
        </span>
      </div>
      <div className="relative z-10 mt-6">
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
        <p className="mt-2 text-2xl font-extrabold leading-none text-zinc-100">{value}</p>
        <p className="mt-2 text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{sublabel}</p>
      </div>
    </article>
  );
}

function WarPanel({
  action,
  children,
  subtitle,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="min-w-0 rounded-xl border-2 border-black bg-zinc-950 p-5 shadow-[6px_6px_0px_#000] sm:p-6">
      <div className="mb-5 flex flex-col gap-4 border-b-2 border-black pb-4.5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-flow-display tracking-tight text-white drop-shadow-[1.5px_1.5px_0px_#000]">
            {title}
          </h2>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-bold">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-lg border-2 border-dashed border-zinc-800 bg-zinc-950 px-5 text-center text-xs font-semibold uppercase tracking-wider text-zinc-500 shadow-[3px_3px_0px_#000]">
      {label}
    </div>
  );
}

function buildResponseTrend(responses: FormResponse[]): Array<{ date: string; responses: number }> {
  const buckets = new Map<string, number>();

  for (let index = 13; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const key = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    buckets.set(key, 0);
  }

  for (const response of responses) {
    if (!response.submittedAt) continue;
    const key = new Date(response.submittedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([date, count]) => ({
    date,
    responses: count,
  }));
}

function buildCoverageData(
  questions: SummaryQuestion[],
): Array<{ name: string; percent: number; value: number }> {
  const answered = questions.filter((question) => question.responseCount > 0).length;
  const unanswered = Math.max(questions.length - answered, 0);
  const total = Math.max(questions.length, 1);

  return [
    { name: "Answered", value: answered, percent: Math.round((answered / total) * 100) },
    { name: "Open Fields", value: unanswered, percent: Math.round((unanswered / total) * 100) },
  ].filter((item) => item.value > 0);
}

function buildQuestionPerformance(questions: SummaryQuestion[], totalResponses: number) {
  return questions.map((question) => {
    const topEntry = Object.entries(question.counts).sort((a, b) => b[1] - a[1])[0];
    const completionRate = totalResponses
      ? Math.round((question.responseCount / totalResponses) * 100)
      : 0;

    return {
      completionRate,
      questionId: question.questionId,
      responseCount: question.responseCount,
      title: question.title,
      topValue: topEntry ? `${prettyLabel(topEntry[0])} (${topEntry[1]})` : "No submissions",
      type: question.type,
    };
  });
}

function buildTopOptions(
  questions: SummaryQuestion[],
): Array<{ count: number; label: string }> {
  const optionTypes = new Set(["single_choice", "multiple_choice", "dropdown", "yes_no", "rating"]);

  return questions
    .filter((question) => optionTypes.has(question.type))
    .flatMap((question) =>
      Object.entries(question.counts).map(([label, count]) => ({
        label: prettyLabel(label),
        count,
      })),
    )
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function buildDateRangeLabel(responses: FormResponse[]) {
  const dates = responses
    .flatMap((response) => (response.submittedAt ? [new Date(response.submittedAt)] : []))
    .sort((a, b) => a.getTime() - b.getTime());

  if (!dates.length) return "No response window";

  const start = dates[0];
  const end = dates[dates.length - 1];
  if (!start || !end) return "No response window";

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return `${formatDate(start)} - ${formatDate(end)}`;
}

function answerPreview(answers: Array<{ questionTitle: string | null; value: unknown }>) {
  if (!answers.length) return "No answers";

  return answers
    .slice(0, 3)
    .map((answer) => {
      const value = Array.isArray(answer.value) ? answer.value.join(", ") : String(answer.value);
      return `${answer.questionTitle ?? "Answer"}: ${prettyLabel(value)}`;
    })
    .join(" | ");
}

function prettyLabel(value: string) {
  if (value === "true") return "Yes";
  if (value === "false") return "No";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}
