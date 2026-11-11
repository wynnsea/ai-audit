import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { formatDateTime } from "@/lib/format";
import type { ChatSession } from "@/lib/types";
import { AppDrawer } from "../app-drawer";
import { ConfirmDialog } from "../confirm-dialog";

type Props = {
  sessions: ChatSession[];
  activeId: string | null;
  disabled: boolean;
  // di layar kecil sidebar berupa laci yang dibuka lewat tombol menu
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  // resolve true kalau berhasil; kalau gagal, pesan error ditampilkan oleh ChatView
  onRename: (id: string, title: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
};

export function SessionSidebar({
  sessions,
  activeId,
  disabled,
  mobileOpen,
  onCloseMobile,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: Props) {
  // hanya satu sesi yang boleh punya menu, mode rename, atau konfirmasi hapus dalam satu waktu
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  return (
    <>
      {/* Esc menutup menu sesi atau mode rename dulu; laci baru tertutup kalau tidak ada yang terbuka */}
      <AppDrawer
        open={mobileOpen}
        onClose={onCloseMobile}
        onNewChat={onNew}
        newChatDisabled={disabled}
        closeOnEscape={
          menuId === null && confirmId === null && renamingId === null
        }
      >
        <h2 className="px-5 pt-3 pb-2 text-xs font-semibold text-muted">
          Riwayat
        </h2>
        <nav className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-4">
          {sessions.length === 0 && (
            <p className="px-3 text-sm text-muted">
              Pertanyaan yang kamu kirim akan tersimpan di sini.
            </p>
          )}
          {sessions.map((s) => (
            <SessionItem
              key={s.id}
              session={s}
              active={s.id === activeId}
              disabled={disabled}
              menuOpen={menuId === s.id}
              renaming={renamingId === s.id}
              onSelect={() => onSelect(s.id)}
              onToggleMenu={() => {
                setConfirmId(null);
                setMenuId(menuId === s.id ? null : s.id);
              }}
              onCloseMenu={() => setMenuId(null)}
              onStartRename={() => {
                setMenuId(null);
                setRenamingId(s.id);
              }}
              onEndRename={() => setRenamingId(null)}
              onStartDelete={() => {
                setMenuId(null);
                setConfirmId(s.id);
              }}
              onRename={(title) => onRename(s.id, title)}
            />
          ))}
        </nav>
      </AppDrawer>

      {/* di luar aside: di HP aside disembunyikan saat laci tertutup, dan dialog di dalamnya ikut tidak tampil */}
      <ConfirmDialog
        open={confirmId !== null}
        title="Hapus chat?"
        description={
          <>
            <span className="font-medium text-ink">
              {sessions.find((s) => s.id === confirmId)?.title || "Tanpa judul"}
            </span>{" "}
            beserta semua pesannya akan dihapus permanen.
          </>
        }
        confirmLabel="Hapus"
        busyLabel="Menghapus…"
        onConfirm={() =>
          confirmId ? onDelete(confirmId) : Promise.resolve(false)
        }
        onClose={() => setConfirmId(null)}
      />
    </>
  );
}

type ItemProps = {
  session: ChatSession;
  active: boolean;
  disabled: boolean;
  menuOpen: boolean;
  renaming: boolean;
  onSelect: () => void;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onStartRename: () => void;
  onEndRename: () => void;
  onStartDelete: () => void;
  onRename: (title: string) => Promise<boolean>;
};

function SessionItem({
  session,
  active,
  disabled,
  menuOpen,
  renaming,
  onSelect,
  onToggleMenu,
  onCloseMenu,
  onStartRename,
  onEndRename,
  onStartDelete,
  onRename,
}: ItemProps) {
  const root = useRef<HTMLDivElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const title = session.title || "Tanpa judul";

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) onCloseMenu();
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseMenu();
        menuButton.current?.focus();
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, onCloseMenu]);

  if (renaming) {
    return (
      <RenameField
        initial={session.title}
        onSave={onRename}
        onDone={onEndRename}
      />
    );
  }

  return (
    <div
      ref={root}
      className={`group relative mb-1 rounded-xl border-2 transition-colors ${
        active || menuOpen
          ? "border-ink bg-peach"
          : "border-transparent hover:border-ink"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-current={active ? "true" : undefined}
        className="w-full rounded-2xl py-2 pr-10 pl-3 text-left disabled:opacity-50"
      >
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="mt-0.5 text-xs text-muted">
          {formatDateTime(session.last_message_at || session.created_at)}
        </div>
      </button>

      {/* di layar sentuh tidak ada hover, jadi tombol menu selalu terlihat; di desktop muncul saat hover */}
      <button
        ref={menuButton}
        type="button"
        aria-label={`Opsi untuk ${title}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        disabled={disabled}
        onClick={onToggleMenu}
        className={`absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-xl text-muted transition-colors hover:bg-surface hover:text-ink focus-visible:opacity-100 disabled:opacity-0 md:opacity-0 md:group-hover:opacity-100 ${
          menuOpen || active ? "md:opacity-100" : ""
        }`}
      >
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
          className="size-4"
        >
          <circle cx="3" cy="8" r="1.4" />
          <circle cx="8" cy="8" r="1.4" />
          <circle cx="13" cy="8" r="1.4" />
        </svg>
      </button>

      {menuOpen && (
        <div
          role="menu"
          aria-label={`Opsi untuk ${title}`}
          className="absolute top-full right-1 z-50 mt-1 w-36 rounded-xl border-[2.5px] border-ink bg-surface p-1.5 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            autoFocus
            onClick={onStartRename}
            className="w-full rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-ledger-soft focus-visible:bg-ledger-soft"
          >
            Ganti nama
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={onStartDelete}
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-danger-soft focus-visible:bg-danger-soft"
          >
            Hapus
          </button>
        </div>
      )}
    </div>
  );
}

function RenameField({
  initial,
  onSave,
  onDone,
}: {
  initial: string;
  onSave: (title: string) => Promise<boolean>;
  onDone: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  // Enter lalu blur bisa memanggil simpan dua kali; flag ini mencegahnya
  const finished = useRef(false);

  useEffect(() => {
    input.current?.select();
  }, []);

  async function save() {
    if (finished.current) return;
    const title = value.trim();
    // judul kosong atau tidak berubah dianggap batal
    if (title === "" || title === initial) {
      finished.current = true;
      onDone();
      return;
    }
    finished.current = true;
    setSaving(true);
    const ok = await onSave(title);
    if (ok) {
      onDone();
    } else {
      // gagal: tetap di mode rename supaya teksnya tidak hilang
      finished.current = false;
      setSaving(false);
      input.current?.focus();
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      finished.current = true;
      onDone();
    }
  }

  return (
    <div className="mb-0.5 rounded-2xl bg-ledger-soft px-2 py-1.5">
      <label className="sr-only" htmlFor="rename-session">
        Nama chat
      </label>
      <input
        id="rename-session"
        ref={input}
        value={value}
        maxLength={60}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={save}
        className="w-full rounded-xl border-[2.5px] border-ink bg-surface px-2 py-1.5 text-base outline-none focus:border-ledger disabled:opacity-60 md:text-sm"
      />
      <p className="mt-1 px-1 text-[11px] text-muted">
        Enter simpan · Esc batal
      </p>
    </div>
  );
}
