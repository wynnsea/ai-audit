"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TickMark } from "./tick-mark";

const links = [
  { href: "/", label: "Chat" },
  { href: "/documents", label: "Dokumen" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    // mengambang di atas konten, jadi isi halaman perlu padding atas sendiri
    <header className="absolute top-3 left-3 z-30 md:left-4">
      <nav className="glass flex h-12 items-center gap-2 rounded-full pr-1.5 pl-2.5 md:gap-4">
        <Link href="/" aria-label="AI Audit" className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-ledger text-surface">
            <TickMark className="size-4" />
          </span>
          <span className="hidden font-serif text-lg font-semibold tracking-tight md:inline">AI Audit</span>
        </Link>

        <div className="flex gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active ? "bg-ledger-soft text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
