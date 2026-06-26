"use client";

import Link from "next/link";
import {
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { trpc } from "~/trpc/client";

type NavKey = "home" | "explore" | "pricing" | "docs" | "dashboard";

const navItems: Array<{ href: string; key: NavKey; label: string }> = [
  { href: "/", key: "home", label: "Home" },
  { href: "/explore", key: "explore", label: "Explore" },
  { href: "/pricing", key: "pricing", label: "Pricing" },
  //{ href: "/api-docs", key: "docs", label: "API Docs" },
  { href: "/dashboard", key: "dashboard", label: "Dashboard" },
];

export function SiteNav({ active }: { active: NavKey }) {
  const utils = trpc.useUtils();
  const { data: me, isLoading } = trpc.auth.me.useQuery(undefined);
  const logout = trpc.auth.logout.useMutation();

  async function handleLogout() {
    await logout.mutateAsync(null);
    utils.auth.me.setData(undefined, null);
    utils.forms.list.setData(undefined, []);
    await utils.auth.me.invalidate();
    await utils.forms.list.invalidate();
  }

  const secondaryLabel = isLoading ? "Checking" : "Sign in";
  const showSecondaryAction = isLoading || !me;
  const primaryLabel = me ? "Dashboard 🛠️" : "Start free";

  return (
    <header className="sticky top-0 z-50 border-b-3 border-black bg-zinc-950/90 shadow-[0_4px_0_#18181b] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 lg:px-8">
        <Link className="flex min-w-0 items-center gap-3 group animate-cartoon-wiggle" href="/">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-200 text-zinc-950 border-2 border-black font-mono text-xl font-black shadow-[3px_3px_0px_#000] -rotate-3 transition-transform group-hover:scale-110 group-hover:rotate-0 duration-200">
            F
          </span>
          <span className="min-w-0">
            <span className="block font-flow-display text-2xl tracking-tight text-white transition-colors group-hover:text-zinc-400 duration-200">
              FlowForm
            </span>
            <span className="hidden text-[9px] font-bold uppercase tracking-[0.25em] text-zinc-500 sm:block">
              NOIR EDIT
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center rounded-lg border-2 border-black bg-zinc-900/50 p-1 md:flex">
          {navItems.map((item) => (
            <Link
              aria-current={active === item.key ? "page" : undefined}
              className={`rounded px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 ${
                active === item.key
                  ? "bg-zinc-200 text-zinc-950 border border-black shadow-[3px_3px_0px_#000]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/40"
              }`}
              href={item.href}
              key={item.key}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          {me ? (
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 lg:flex">
                <Badge className="rounded border-2 border-black bg-zinc-200 text-zinc-950 shadow-[2px_2px_0_#000] font-black uppercase text-[10px]" variant="outline">
                  <ShieldCheck className="mr-1 size-3" />
                  Signed in
                </Badge>
                <span className="max-w-[180px] truncate text-xs text-zinc-450 uppercase font-semibold tracking-wider flex items-center gap-1.5">
                  <Mail className="size-3 text-zinc-500" />
                  <span className="truncate">{me.email}</span>
                </span>
              </div>
              <Button
                className="h-9 rounded-lg border-2 border-black bg-zinc-900 text-xs font-bold uppercase tracking-wider text-zinc-350 shadow-[3px_3px_0px_#000] hover:bg-zinc-850 hover:text-white"
                disabled={logout.isPending}
                onClick={() => void handleLogout()}
                size="sm"
                variant="outline"
              >
                {logout.isPending ? (
                  <Loader2 className="mr-1 size-3 animate-spin" />
                ) : (
                  <LogOut className="mr-1 size-3" />
                )}
                Sign out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {showSecondaryAction ? (
                <Link
                  className="hidden rounded-lg border-2 border-black bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-405 shadow-[3px_3px_0px_#000] hover:bg-zinc-900 hover:text-white transition-all hover:scale-105 active:scale-95 sm:inline-flex"
                  href="/dashboard"
                >
                  {secondaryLabel}
                </Link>
              ) : null}
              <Link
                className="rounded-lg bg-zinc-200 text-zinc-950 px-5 py-2 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#000] border-2 border-black transition-all hover:bg-white hover:scale-105 active:scale-95"
                href="/dashboard"
              >
                {primaryLabel}
              </Link>
            </div>
          )}
        </div>
      </div>
      <nav
        aria-label="Mobile navigation"
        className="flex gap-2 overflow-x-auto border-t-2 border-black bg-zinc-950/95 px-5 py-2 md:hidden"
      >
        {navItems.map((item) => (
          <Link
            aria-current={active === item.key ? "page" : undefined}
            className={`shrink-0 rounded px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition ${
              active === item.key
                ? "bg-zinc-200 text-zinc-950 border border-black shadow-[2px_2px_0px_#000]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
            href={item.href}
            key={item.key}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
