import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  busyLabel: string;
  // resolve setelah aksi selesai; pesan error ditampilkan oleh halaman pemanggil
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
};

// pop-up konfirmasi untuk aksi yang tidak bisa dibatalkan, misal hapus.
// <dialog> + showModal(): browser yang mengurus lapisan di atas halaman, fokus keyboard, dan Esc.
export function ConfirmDialog({ open, title, description, confirmLabel, busyLabel, onConfirm, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      // ditutup juga saat gagal, supaya pesan error di halaman tidak tertutup pop-up
      onClose();
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="confirm-title"
      // Esc: jangan tutup selagi proses berjalan
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
      // klik di luar kotak (di backdrop) = batal
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-[28px] border border-rule bg-surface p-6 text-ink shadow-xl backdrop:bg-black/40"
    >
      <h2 id="confirm-title" className="font-serif text-xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-2 text-sm leading-relaxed text-muted">{description}</div>
      <div className="mt-6 flex justify-end gap-2">
        {/* fokus awal di Batal: Enter yang tidak sengaja tidak langsung menghapus */}
        <button
          type="button"
          autoFocus
          disabled={busy}
          onClick={onClose}
          className="rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-ledger-soft disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={confirm}
          className="rounded-full bg-danger px-4 py-2 text-sm font-semibold text-surface transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
