import { formatDateTime } from "@/lib/format";
import type { ChatSession } from "@/lib/types";

type Props = {
  sessions: ChatSession[];
  activeId: string | null;
  disabled: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
};

export function SessionSidebar({ sessions, activeId, disabled, onSelect, onNew }: Props) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-rule bg-surface md:flex">
      <div className="p-4">
        <button
          type="button"
          onClick={onNew}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-ledger px-3 py-2.5 text-sm font-semibold text-surface transition-colors hover:bg-ledger-strong disabled:opacity-50"
        >
          <span aria-hidden="true" className="text-base leading-none">+</span>
          Chat baru
        </button>
      </div>

      <h2 className="px-5 pb-2 text-xs font-semibold text-muted">Riwayat</h2>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
        {sessions.length === 0 && (
          <p className="px-3 text-sm text-muted">Pertanyaan yang kamu kirim akan tersimpan di sini.</p>
        )}
        {sessions.map((s) => {
          const active = s.id === activeId;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              disabled={disabled}
              aria-current={active ? "true" : undefined}
              className={`mb-0.5 w-full border-l-2 px-3 py-2 text-left transition-colors disabled:opacity-50 ${
                active
                  ? "border-ledger bg-ledger-soft"
                  : "border-transparent hover:bg-paper"
              }`}
            >
              <div className="truncate text-sm font-medium">{s.title || "Tanpa judul"}</div>
              <div className="mt-0.5 text-xs text-muted">{formatDateTime(s.created_at)}</div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
