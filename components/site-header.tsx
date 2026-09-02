"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, CalendarRange, LayoutDashboard, Newspaper, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "League", icon: LayoutDashboard },
  { href: "/schedule", label: "Schedule", icon: CalendarRange },
  { href: "/assistant", label: "Assistant", icon: Bot },
  { href: "/news", label: "Weekly stories", icon: Newspaper },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-[#17122b]/95 text-white shadow-[0_8px_30px_rgba(23,18,43,0.12)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="mr-auto flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff5b]"
          aria-label="Goofy Cup home"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-[#dfff5b] text-[#17122b] shadow-[3px_3px_0_#6541d8]">
            <Trophy className="size-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#dfff5b]">
              Fantasy football
            </span>
            <span className="block text-lg font-black leading-none tracking-tight">
              Goofy Cup
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Primary navigation">
          {nav.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#dfff5b]",
                  active
                    ? "bg-white/14 text-white"
                    : "text-white/65 hover:bg-white/8 hover:text-white",
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
