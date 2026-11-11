type Props = {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
};

// nomor halaman yang ditampilkan: awal, akhir, dan dua di sekitar halaman aktif; sisanya "…"
function pageItems(page: number, pageCount: number): (number | "gap")[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  const items: (number | "gap")[] = [];
  for (const [i, p] of sorted.entries()) {
    if (i > 0 && p - sorted[i - 1] > 1) items.push("gap");
    items.push(p);
  }
  return items;
}

const arrowClass =
  "grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-ledger-soft hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent";

export function Pagination({ page, pageCount, onChange }: Props) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Halaman" className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Halaman sebelumnya"
        className={arrowClass}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
          <path d="M10 3.5 5.5 8l4.5 4.5" />
        </svg>
      </button>

      {pageItems(page, pageCount).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="w-6 text-center text-sm text-muted" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Halaman ${p}`}
            className={`h-9 min-w-9 rounded-lg border-2 px-2 text-sm font-bold tabular-nums transition-colors ${
              p === page ? "border-ink bg-ink text-surface" : "border-transparent text-muted hover:border-ink hover:text-ink"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pageCount}
        aria-label="Halaman berikutnya"
        className={arrowClass}
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="size-4">
          <path d="M6 3.5 10.5 8 6 12.5" />
        </svg>
      </button>
    </nav>
  );
}
