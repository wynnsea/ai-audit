import { useState } from "react";
import { documentFileUrl } from "@/lib/api";
import { ConfirmDialog } from "../confirm-dialog";
import { formatDateTime, modelLabel } from "@/lib/format";
import type { StoredDocument, DocumentStatus } from "@/lib/types";
import { TickMark } from "../tick-mark";

export const statusStyle: Record<DocumentStatus, { label: string; className: string }> = {
  processing: { label: "Diproses", className: "bg-warn-soft text-ink" },
  ready: { label: "Siap", className: "bg-lime text-ink" },
  failed: { label: "Gagal", className: "bg-danger-soft text-ink" },
};

function StatusBadge({ status }: { status: DocumentStatus }) {
  const s = statusStyle[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border-2 border-ink px-2 py-0.5 text-xs font-bold ${s.className}`}>
      {status === "ready" && <TickMark className="size-3" />}
      {status === "processing" && (
        <span className="size-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />
      )}
      {s.label}
    </span>
  );
}

type Props = {
  documents: StoredDocument[];
  // ditampilkan kalau daftar kosong; berbeda antara "belum ada dokumen" dan "tidak ada hasil filter"
  emptyMessage: string;
  // pesan error ditampilkan oleh DocumentsView
  onDelete: (id: string) => Promise<boolean>;
};

export function DocumentTable({ documents, emptyMessage, onDelete }: Props) {
  // dokumen yang sedang ditanyakan di pop-up hapus
  const [toDelete, setToDelete] = useState<StoredDocument | null>(null);

  return (
    <>
      {documents.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-rule px-4 py-10 text-center text-sm text-muted">
          {emptyMessage}
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

function DeleteButton({ doc, onAskDelete }: { doc: StoredDocument; onAskDelete: (doc: StoredDocument) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAskDelete(doc)}
      aria-label={`Hapus ${doc.title}`}
      title="Hapus dokumen"
      className="grid size-9 shrink-0 place-items-center rounded-xl text-muted transition-colors hover:bg-danger-soft hover:text-danger"
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
  );
}

function FileInfo({ doc }: { doc: StoredDocument }) {
  return (
    <>
      <a
        href={documentFileUrl(doc.id)}
        target="_blank"
        rel="noreferrer"
        title="Buka file asli"
        className="text-xs break-all text-muted underline-offset-2 hover:text-ledger hover:underline"
      >
        {doc.file_name} ↗
      </a>
      {doc.ocr_model && <div className="text-xs text-muted">OCR: {modelLabel(doc.ocr_model)}</div>}
    </>
  );
}

type ListProps = {
  documents: StoredDocument[];
  onAskDelete: (doc: StoredDocument) => void;
};

// tabel untuk layar lebar, kartu untuk HP: tabel 5 kolom tidak muat di layar 360px,
// dan tanpa scrollbar user tidak tahu kolom Status dan tombol Hapus ada di luar layar
function Table(props: ListProps) {
  return (
    <>
      <div className="hidden md:block">
        <WideTable {...props} />
      </div>
      <div className="md:hidden">
        <CardList {...props} />
      </div>
    </>
  );
}

function CardList({ documents, onAskDelete }: ListProps) {
  return (
    <ul className="glass divide-y divide-rule overflow-hidden rounded-2xl">
      {documents.map((doc) => (
        <li key={doc.id} className="flex gap-2 py-3.5 pr-2 pl-4">
          <div className="min-w-0 flex-1">
            <div className="text-base font-bold break-words">{doc.title}</div>
            <FileInfo doc={doc} />
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <StatusBadge status={doc.status} />
              {doc.regulation_type && <span>{doc.regulation_type}</span>}
              <span>{formatDateTime(doc.created_at)}</span>
            </div>
            {doc.error_message && <div className="mt-1 text-xs break-words text-danger">{doc.error_message}</div>}
          </div>
          <DeleteButton doc={doc} onAskDelete={onAskDelete} />
        </li>
      ))}
    </ul>
  );
}

function WideTable({ documents, onAskDelete }: ListProps) {
  return (
    <div className="glass no-scrollbar overflow-x-auto rounded-2xl">
      <table className="w-full text-left text-sm">
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
                <div className="text-base font-bold">{doc.title}</div>
                <FileInfo doc={doc} />
              </td>
              <td className="px-5 py-3.5">{doc.regulation_type || <span className="text-muted">-</span>}</td>
              <td className="px-5 py-3.5">
                <StatusBadge status={doc.status} />
                {doc.error_message && (
                  <div className="mt-1 max-w-xs text-xs text-danger">{doc.error_message}</div>
                )}
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap text-muted">{formatDateTime(doc.created_at)}</td>
              <td className="px-3 py-3.5">
                <div className="flex justify-end">
                  <DeleteButton doc={doc} onAskDelete={onAskDelete} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
