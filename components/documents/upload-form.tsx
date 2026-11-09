"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { ModelSelect } from "../chat/model-select";

// sama dengan batas di Go (document_controller.go), dicek duluan biar tidak perlu upload sia-sia
const MAX_FILE_MB = 40;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
// batas sekali pilih; lebih dari ini lebih baik dibagi beberapa kali supaya mudah dipantau
const MAX_FILES = 50;
const ACCEPT = [".pdf", ".docx", ".txt", ".xlsx", ".png", ".jpg", ".jpeg"];

type FileStatus = "waiting" | "uploading" | "done" | "failed";

type QueuedFile = {
  key: string;
  file: File;
  status: FileStatus;
  error?: string;
};

const statusLabel: Record<FileStatus, string> = {
  waiting: "Menunggu",
  uploading: "Mengupload…",
  done: "Terkirim",
  failed: "Gagal",
};

const statusClass: Record<FileStatus, string> = {
  waiting: "text-muted",
  uploading: "text-warn",
  done: "text-ledger",
  failed: "text-danger",
};

// cek di browser dulu, supaya file yang pasti ditolak server tidak perlu diupload
function validate(file: File): string | undefined {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!ACCEPT.includes(ext)) return "Format tidak didukung";
  if (file.size === 0) return "File kosong";
  if (file.size > MAX_FILE_BYTES) return `Lebih dari ${MAX_FILE_MB} MB`;
  return undefined;
}

export function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // posisi upload yang sedang berjalan, untuk label tombol "Mengupload 3/20…"
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("");
  const [ocrModels, setOcrModels] = useState<string[]>([]);
  const [ocrModel, setOcrModel] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ignore = false;
    api
      .listOcrModels()
      .then((list) => {
        if (ignore) return;
        setOcrModels(list);
        setOcrModel(list[0] ?? null);
      })
      .catch(() => {
        // tanpa daftar, pilihan disembunyikan dan service memakai model default
      });
    return () => {
      ignore = true;
    };
  }, []);

  function selectFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    setError(null);
    if (files.length > MAX_FILES) {
      setError(`Maksimal ${MAX_FILES} file sekali upload. Bagi jadi beberapa kali.`);
      setQueue([]);
      return;
    }
    setQueue(
      files.map((file, i) => {
        const invalid = validate(file);
        return {
          key: `${Date.now()}-${i}-${file.name}`,
          file,
          status: invalid ? "failed" : "waiting",
          error: invalid,
        };
      }),
    );
  }

  function update(key: string, patch: Partial<QueuedFile>) {
    setQueue((q) => q.map((f) => (f.key === key ? { ...f, ...patch } : f)));
  }

  function clear() {
    setQueue([]);
    setTitle("");
    setError(null);
    if (input.current) input.current.value = "";
  }

  async function submit() {
    const pending = queue.filter((f) => f.status === "waiting");
    if (pending.length === 0) {
      setError("Pilih file terlebih dahulu.");
      return;
    }

    setUploading(true);
    setError(null);
    // satu per satu: server cukup cepat membalas (proses berat jalan di belakang dan antre di sana),
    // dan urutan status di daftar jadi mudah diikuti
    for (const [i, item] of pending.entries()) {
      setProgress({ current: i + 1, total: pending.length });
      update(item.key, { status: "uploading" });
      const form = new FormData();
      form.append("file", item.file);
      // judul hanya berlaku untuk satu file; untuk banyak file server memakai nama file
      if (queue.length === 1 && title.trim()) form.append("title", title.trim());
      if (docType.trim()) form.append("regulation_type", docType.trim());
      if (ocrModel) form.append("ocr_model", ocrModel);
      try {
        await api.uploadDocument(form);
        update(item.key, { status: "done" });
        onUploaded();
      } catch (err) {
        update(item.key, { status: "failed", error: err instanceof Error ? err.message : "Upload gagal" });
      }
    }
    setUploading(false);
    if (input.current) input.current.value = "";
  }

  const single = queue.length === 1;
  const waiting = queue.filter((f) => f.status === "waiting").length;
  const done = queue.filter((f) => f.status === "done").length;
  const failed = queue.filter((f) => f.status === "failed").length;
  const finished = queue.length > 0 && waiting === 0 && !uploading;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="glass rounded-[28px] p-5">
      {/* input file dibuat transparan menutupi area ini, jadi klik & drag-drop ditangani browser */}
      <label
        onDragEnter={() => setDragging(true)}
        onDragLeave={() => setDragging(false)}
        onDrop={() => setDragging(false)}
        className={`relative flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragging ? "border-ledger bg-ledger-soft" : "border-rule hover:border-ledger"
        } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT.join(",")}
          disabled={uploading}
          onChange={(e) => selectFiles(e.target.files)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        {queue.length > 0 ? (
          <>
            <span className="font-medium">{queue.length} file dipilih</span>
            <span className="mt-1 text-sm text-muted">Klik untuk ganti pilihan</span>
          </>
        ) : (
          <>
            <span className="font-medium">Tarik file ke sini atau klik untuk memilih</span>
            <span className="mt-1 text-sm text-muted">
              Bisa beberapa file sekaligus (maksimal {MAX_FILES}). PDF, DOCX, TXT, XLSX, PNG, JPG, atau
              JPEG, masing-masing maksimal {MAX_FILE_MB} MB. PDF hasil scan dan gambar dibaca dengan OCR.
            </span>
          </>
        )}
      </label>

      {queue.length > 0 && (
        <ul className="no-scrollbar mt-3 max-h-64 divide-y divide-rule overflow-y-auto rounded-[20px] border border-rule bg-surface/60 text-sm">
          {queue.map((f) => (
            <li key={f.key} className="flex items-baseline justify-between gap-3 px-4 py-2">
              <span className="min-w-0 truncate" title={f.file.name}>
                {f.file.name}
              </span>
              <span className={`shrink-0 text-xs font-medium ${statusClass[f.status]}`}>
                {f.status === "failed" && f.error ? f.error : statusLabel[f.status]}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* di kanan: daftar ModelSelect membuka ke atas dan rata kanan */}
      {ocrModels.length > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
          <span className="text-muted">Model OCR</span>
          <ModelSelect models={ocrModels} model={ocrModel} disabled={uploading} onChange={setOcrModel} />
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-[3fr_2fr_auto] sm:items-end">
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Judul</span>
          <input
            type="text"
            value={single || queue.length === 0 ? title : ""}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading || queue.length > 1}
            placeholder={
              queue.length > 1 ? "Memakai nama masing-masing file" : "Contoh: Kebijakan Keamanan Informasi 2026"
            }
            className="w-full min-w-0 rounded-full border border-rule bg-surface/60 px-4 py-2 placeholder:text-muted focus:border-ledger focus:outline-none disabled:opacity-60"
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Jenis</span>
          <input
            type="text"
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            disabled={uploading}
            placeholder="Contoh: Regulasi, SOP, CV"
            className="w-full min-w-0 rounded-full border border-rule bg-surface/60 px-4 py-2 placeholder:text-muted focus:border-ledger focus:outline-none disabled:opacity-60"
          />
        </label>
        {finished ? (
          <button
            type="button"
            onClick={clear}
            className="h-10 rounded-full border border-rule px-5 text-sm font-semibold transition-colors hover:bg-ledger-soft"
          >
            Upload lagi
          </button>
        ) : (
          <button
            type="submit"
            disabled={uploading || waiting === 0}
            className="h-10 rounded-full bg-ledger px-5 text-sm font-semibold text-surface transition-colors hover:bg-ledger-strong disabled:opacity-50"
          >
            {uploading
              ? `Mengupload ${progress.current}/${progress.total}…`
              : waiting > 1
                ? `Upload ${waiting} dokumen`
                : "Upload dokumen"}
          </button>
        )}
      </div>

      {finished && (
        <p className="mt-3 text-sm text-muted">
          {done} file terkirim{failed > 0 ? `, ${failed} gagal` : ""}. Dokumen bisa ditanyakan setelah
          statusnya Siap di tabel di bawah.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
