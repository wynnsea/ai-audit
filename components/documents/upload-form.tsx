"use client";

import { useActionState, useState } from "react";
import { api } from "@/lib/api";

// sama dengan batas di Go (document_controller.go), dicek duluan biar tidak perlu upload sia-sia
const MAX_FILE_MB = 40;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

type UploadState = { error: string | null };

export function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  // nama file yang dipilih, ditampilkan di area drop
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [state, formAction, pending] = useActionState(
    async (_prev: UploadState, formData: FormData): Promise<UploadState> => {
      const file = formData.get("file");
      if (!(file instanceof File) || file.size === 0) {
        return { error: "Pilih file terlebih dahulu." };
      }
      if (file.size > MAX_FILE_BYTES) {
        return { error: `Ukuran file maksimal ${MAX_FILE_MB} MB.` };
      }

      try {
        await api.uploadDocument(formData);
        setFileName(null);
        onUploaded();
        return { error: null };
      } catch (e) {
        return { error: e instanceof Error ? e.message : "Upload gagal" };
      }
    },
    { error: null },
  );

  return (
    // form dengan action otomatis di-reset oleh React setelah action selesai
    <form action={formAction} className="rounded-xl border border-rule bg-surface p-5">
      {/* input file dibuat transparan menutupi area ini, jadi klik & drag-drop ditangani browser */}
      <label
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDrop={() => setDragging(false)}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragging ? "border-ledger bg-ledger-soft" : "border-rule hover:border-ledger"
        }`}
      >
        <input
          type="file"
          name="file"
          accept=".pdf,.docx,.txt"
          required
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        {fileName ? (
          <>
            <span className="font-medium break-all">{fileName}</span>
            <span className="mt-1 text-sm text-muted">Klik untuk ganti file</span>
          </>
        ) : (
          <>
            <span className="font-medium">Tarik file ke sini atau klik untuk memilih</span>
            <span className="mt-1 text-sm text-muted">
              PDF, DOCX, atau TXT, maksimal {MAX_FILE_MB} MB. PDF hasil scan dibaca dengan OCR.
            </span>
          </>
        )}
      </label>

      <div className="mt-4 grid gap-3 sm:grid-cols-[3fr_2fr_auto] sm:items-end">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Judul</span>
          <input
            type="text"
            name="title"
            placeholder="UU 27/2022 Pelindungan Data Pribadi"
            className="rounded-lg border border-rule bg-paper px-3 py-2 placeholder:text-muted focus:border-ledger focus:outline-none"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Jenis</span>
          <input
            type="text"
            name="regulation_type"
            placeholder="UU PDP, ISO 27001"
            className="rounded-lg border border-rule bg-paper px-3 py-2 placeholder:text-muted focus:border-ledger focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-ledger px-5 text-sm font-semibold text-surface transition-colors hover:bg-ledger-strong disabled:opacity-50"
        >
          {pending ? "Mengupload…" : "Upload dokumen"}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">Judul dan jenis boleh dikosongkan, judul akan diambil dari nama file.</p>

      {state.error && (
        <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
