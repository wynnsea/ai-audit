"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const iconProps = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  className: "size-4 shrink-0",
};

const plusIcon = (
  <svg {...iconProps}>
    <path d="M8 3v10M3 8h10" />
  </svg>
);

const documentIcon = (
  <svg {...iconProps}>
    <path d="M4 1.75h5l3 3v9.5H4z" />
    <path d="M9 1.75v3h3M6 8.5h4M6 11h4" />
  </svg>
);

const buttonBase =
  "neo-btn flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-ink disabled:opacity-50";

type Props = {
  // di HP laci tertutup sampai tombol menu diklik; di layar lebar selalu tampil di kiri
  open: boolean;
  onClose: () => void;
  // false selama ada menu/dialog di dalam laci, supaya Esc menutup itu dulu
  closeOnEscape?: boolean;
  // di halaman chat: mulai chat baru di tempat; di halaman lain tombolnya membuka halaman chat
  onNewChat?: () => void;
  newChatDisabled?: boolean;
  children?: ReactNode;
};

// navigasi utama (Chat baru, Dokumen) plus isi khusus halaman, misal riwayat chat
export function AppDrawer({
  open,
  onClose,
  closeOnEscape = true,
  onNewChat,
  newChatDisabled = false,
  children,
}: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeOnEscape, onClose]);

  return (
    <>
      {/* selalu dirender supaya bisa memudar saat ditutup; tidak menangkap klik selama tertutup */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* HP: laci bergeser masuk dari kiri dengan sedikit pantulan. Saat tertutup, invisible ikut
          berganti setelah geseran selesai, sehingga laci tidak bisa difokus dengan keyboard.
          Layar lebar: selalu tampil, tanpa geseran. */}
      <aside
        className={`glass-thick fixed inset-y-3 left-3 z-40 flex w-[min(18rem,calc(100vw-1.5rem))] flex-col rounded-2xl transition-[translate,visibility] duration-250 ease-[cubic-bezier(0.2,0.9,0.3,1.12)] md:visible md:static md:z-auto md:my-4 md:ml-4 md:w-72 md:shrink-0 md:translate-x-0 md:transition-none ${
          open ? "visible translate-x-0" : "invisible -translate-x-[115%]"
        }`}
      >
        {/* Chat baru (biru, aksi utama) dan Dokumen (putih); halaman chat sendiri dibuka lewat Chat baru */}
        <nav
          aria-label="Menu utama"
          className={`flex flex-col gap-2.5 p-3 ${children ? "border-b-[2.5px] border-ink" : ""}`}
        >
          {onNewChat ? (
            <button
              type="button"
              onClick={onNewChat}
              disabled={newChatDisabled}
              className={`${buttonBase} bg-sky`}
            >
              {plusIcon}
              Chat baru
            </button>
          ) : (
            <Link href="/" onClick={onClose} className={`${buttonBase} bg-sky`}>
              {plusIcon}
              Chat baru
            </Link>
          )}
          <Link
            href="/documents"
            onClick={onClose}
            aria-current={pathname === "/documents" ? "page" : undefined}
            className={`${buttonBase} bg-surface`}
          >
            {documentIcon}
            Dokumen
          </Link>
        </nav>
        {children}
      </aside>
    </>
  );
}

// tombol pembuka laci di HP, dengan latar polos supaya isi yang digulir tidak terlihat di belakangnya
export function DrawerButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-20 h-16 bg-paper md:hidden">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={open}
        aria-label="Buka menu"
        className="neo-btn pointer-events-auto absolute top-3 left-3 grid size-11 place-items-center rounded-lg bg-surface"
      >
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
          className="size-4.5"
        >
          <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
        </svg>
      </button>
    </div>
  );
}
