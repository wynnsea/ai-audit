"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { AuditDocument } from "@/lib/types";
import { DocumentTable } from "./document-table";
import { UploadForm } from "./upload-form";

// selama ada dokumen yang masih diproses (OCR/embedding), daftar di-refresh berkala
const POLL_INTERVAL_MS = 3000;

export function DocumentsView() {
  const [documents, setDocuments] = useState<AuditDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // dinaikkan setiap kali daftar perlu diambil ulang (setelah upload / saat polling)
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    try {
      await api.deleteDocument(id);
      setDocuments((docs) => docs.filter((d) => d.id !== id));
      setError(null);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghapus dokumen");
      return false;
    }
  }, []);

  useEffect(() => {
    // ignore: kalau effect sudah diganti request baru, hasil request lama dibuang
    let ignore = false;
    api
      .listDocuments()
      .then((docs) => {
        if (ignore) return;
        setDocuments(docs);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!ignore) setError(e instanceof Error ? e.message : "Gagal memuat dokumen");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const hasProcessing = documents.some((d) => d.status === "processing");
  useEffect(() => {
    if (!hasProcessing) return;
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hasProcessing, refresh]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pt-20 pb-8 md:px-6 md:pt-24 md:pb-12">
        <div>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">Dokumen</h1>
          <p className="mt-2 max-w-2xl text-[15px] text-muted">
            Dokumen yang jadi sumber jawaban chat. Dokumen baru bisa ditanyakan
            setelah statusnya Siap.
          </p>
        </div>

        <UploadForm onUploaded={refresh} />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted">
            {loading ? "Memuat dokumen…" : `${documents.length} dokumen`}
          </h2>

          {error && (
            <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          {!loading && <DocumentTable documents={documents} onDelete={deleteDocument} />}
        </section>
      </div>
    </div>
  );
}
