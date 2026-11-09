import { useState } from "react";
import { documentFileUrl } from "@/lib/api";
import { ConfirmDialog } from "../confirm-dialog";
import { formatDateTime, modelLabel } from "@/lib/format";
import type { AuditDocument, DocumentStatus } from "@/lib/types";
import { TickMark } from "../tick-mark";

const statusStyle: Record<DocumentStatus, { label: string; className: string }> = {
  processing: { label: "Diproses", className: "bg-warn-soft text-warn" },
  ready: { label: "Siap", className: "bg-ledger-soft text-ledger" },
  failed: { label: "Gagal", className: "bg-danger-soft text-danger" },
};

function StatusBadge({ status }: { status: DocumentStatus }) {
  const s = statusStyle[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.className}`}>
      {status === "ready" && <TickMark className="size-3" />}
      {status === "processing" && (
        <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />
      )}
      {s.label}
    </span>
  );
}

type Props = {
  documents: AuditDocument[];
  // pesan error ditampilkan oleh DocumentsView
  onDelete: (id: string) => Promise<boolean>;
};

export function DocumentTable({ documents, onDelete }: Props) {
  // dokumen yang sedang ditanyakan di pop-up hapus
  const [toDelete, setToDelete] = useState<AuditDocument | null>(null);

  return (
    <>
      {documents.length === 0 ? (
        <p className="rounded-[28px] border border-dashed border-rule px-4 py-10 text-center text-sm text-muted">
          Belum ada dokumen. Upload dokumen pertama di atas.
        </p>
      ) : (
        <Table documents={documents} onAskDelete={setToDelete} />
      )}

      {/* dirender di luar tabel supaya tetap ada saat dokumen terakhir dihapus */}
      <ConfirmDialog
        open={toDelete !== null}
        title="Hapus dokumen?"
        description={
          <>
            <span className="font-medium text-ink">{toDelete?.title}</span> beserta file aslinya akan
            dihapus permanen dan tidak bisa dipakai lagi sebagai sumber jawaban.
          </>
        }
        confirmLabel="Hapus"
        busyLabel="Menghapus…"
        onConfirm={() => (toDelete ? onDelete(toDelete.id) : Promise.resolve(false))}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

function Table({
  documents,
  onAskDelete,
}: {
  documents: AuditDocument[];
  onAskDelete: (doc: AuditDocument) => void;
}) {
  return (
    <div className="glass overflow-x-auto rounded-[28px]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-rule text-xs text-muted">
          <tr>
            <th className="px-5 py-2.5 font-semibold">Dokumen</th>
            <th className="px-5 py-2.5 font-semibold">Jenis</th>
            <th className="px-5 py-2.5 font-semibold">Status</th>
            <th className="px-5 py-2.5 font-semibold">Diupload</th>
            <th className="px-5 py-2.5">
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td className="px-5 py-3.5">
                <div className="font-serif text-base font-semibold">{doc.title}</div>
                <a
                  href={documentFileUrl(doc.id)}
                  target="_blank"
                  rel="noreferrer"
                  title="Buka file asli"
                  className="text-xs text-muted underline-offset-2 hover:text-ledger hover:underline"
                >
                  {doc.file_name} ↗
                </a>
                {doc.ocr_model && (
                  <div className="text-xs text-muted">OCR: {modelLabel(doc.ocr_model)}</div>
                )}
              </td>
              <td className="px-5 py-3.5">{doc.regulation_type || <span className="text-muted">-</span>}</td>
              <td className="px-5 py-3.5">
                <StatusBadge status={doc.status} />
                {doc.error_message && (
                  <div className="mt-1 max-w-xs text-xs text-danger">{doc.error_message}</div>
                )}
              </td>
              <td className="px-5 py-3.5 text-muted">{formatDateTime(doc.created_at)}</td>
              <td className="px-3 py-3.5 text-right">
                <button
                  type="button"
                  onClick={() => onAskDelete(doc)}
                  aria-label={`Hapus ${doc.title}`}
                  title="Hapus dokumen"
                  className="ml-auto grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-danger-soft hover:text-danger"
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="size-4"
                  >
                    <path d="M2.5 4h11M6.5 4V2.5h3V4M4 4l.6 9a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L12 4M6.7 7v4M9.3 7v4" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
