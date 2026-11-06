import { formatDateTime } from "@/lib/format";
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

export function DocumentTable({ documents }: { documents: AuditDocument[] }) {
  if (documents.length === 0) {
    return (
      <p className="rounded-[28px] border border-dashed border-rule px-4 py-10 text-center text-sm text-muted">
        Belum ada dokumen. Upload dokumen pertama di atas.
      </p>
    );
  }

  return (
    <div className="glass overflow-x-auto rounded-[28px]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-rule text-xs text-muted">
          <tr>
            <th className="px-5 py-2.5 font-semibold">Dokumen</th>
            <th className="px-5 py-2.5 font-semibold">Jenis</th>
            <th className="px-5 py-2.5 font-semibold">Status</th>
            <th className="px-5 py-2.5 font-semibold">Diupload</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {documents.map((doc) => (
            <tr key={doc.id}>
              <td className="px-5 py-3.5">
                <div className="font-serif text-base font-semibold">{doc.title}</div>
                <div className="text-xs text-muted">{doc.file_name}</div>
              </td>
              <td className="px-5 py-3.5">{doc.regulation_type || <span className="text-muted">-</span>}</td>
              <td className="px-5 py-3.5">
                <StatusBadge status={doc.status} />
                {doc.error_message && (
                  <div className="mt-1 max-w-xs text-xs text-danger">{doc.error_message}</div>
                )}
              </td>
              <td className="px-5 py-3.5 text-muted">{formatDateTime(doc.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
