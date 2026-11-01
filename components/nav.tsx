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
    <header className="border-b border-rule bg-surface">
      <nav className="flex h-14 items-center gap-8 px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-ledger text-surface">
            <TickMark className="size-4" />
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight">AI Audit</span>
        </Link>

        <div className="flex h-full gap-6">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center border-b-2 text-sm font-medium transition-colors ${
                  active
                    ? "border-ledger text-ink"
                    : "border-transparent text-muted hover:text-ink"
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
