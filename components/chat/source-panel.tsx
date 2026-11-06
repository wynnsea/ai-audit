import { useEffect } from "react";
import type { Source } from "@/lib/types";
import { shortSection } from "./message-bubble";

type Props = {
  source: Source | null;
  onClose: () => void;
};

// panel samping berisi kutipan asli dokumen untuk satu sitasi
export function SourcePanel({ source, onClose }: Props) {
  useEffect(() => {
    if (!source) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [source, onClose]);

  if (!source) return null;

  // "BAB VI ... > Bagian Kedua ... > Pasal 40" → jejak lokasi tanpa pasal terakhir
  const trail = source.section.split(" > ").slice(0, -1);

  return (
    // bg-black, bukan bg-ink: di mode gelap ink hampir putih dan membuat seluruh layar silau
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Sumber ${source.number}`}
        onClick={(e) => e.stopPropagation()}
        className="glass-thick animate-slide-in m-3 flex w-full max-w-lg flex-col overflow-hidden rounded-[28px]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-rule px-5 py-4 md:px-6 md:py-5">
          <div className="min-w-0">
            <p className="text-sm text-muted">
              Sumber {source.number} dari {source.document_title}
            </p>
            <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight md:text-3xl">
              {shortSection(source.section)}
            </h2>
            {trail.length > 0 && (
              <p className="mt-2 text-sm text-muted">{trail.join(" / ")}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-2 text-muted transition-colors hover:bg-ledger-soft hover:text-ink"
          >
            <svg viewBox="0 0 16 16" className="size-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
              <path d="M3 3l10 10M13 3 3 13" />
            </svg>
          </button>
        </header>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-6">
          <blockquote className="font-serif text-[17px] leading-[1.75] whitespace-pre-wrap">
            {source.content}
          </blockquote>
        </div>

        <footer className="flex gap-6 border-t border-rule px-5 py-3 text-sm text-muted md:px-6">
          {source.page ? <span>Halaman {source.page}</span> : null}
          <span>Kecocokan {Math.round(source.score * 100)}%</span>
        </footer>
      </aside>
    </div>
  );
}
