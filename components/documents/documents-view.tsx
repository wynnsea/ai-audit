"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { StoredDocument, DocumentStatus } from "@/lib/types";
import { AppDrawer, DrawerButton } from "../app-drawer";
import { Pagination } from "../pagination";
import { Select } from "../select";
import { DocumentTable, statusStyle } from "./document-table";
import { UploadForm } from "./upload-form";

// selama ada dokumen yang masih diproses (OCR/embedding), daftar di-refresh berkala
const POLL_INTERVAL_MS = 3000;

const PAGE_SIZES = [10, 25, 50, 100];
const ALL = "all";
// nilai filter untuk dokumen yang kolom Jenis-nya kosong
const NO_TYPE = "__none__";

type StatusFilter = typeof ALL | DocumentStatus;

// pencarian tidak membedakan huruf besar/kecil dan spasi berlebih
function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function DocumentsView() {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // dinaikkan setiap kali daftar perlu diambil ulang (setelah upload / saat polling)
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // filter dan halaman dihitung di browser dari daftar lengkap; daftar ini juga dipakai polling status
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>(ALL);
  const [docType, setDocType] = useState(ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
  const tableTop = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

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
        if (!ignore)
          setError(e instanceof Error ? e.message : "Gagal memuat dokumen");
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

  const typeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of documents) {
      const t = d.regulation_type?.trim() || NO_TYPE;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    const types = [...counts.keys()]
      .filter((t) => t !== NO_TYPE)
      .sort((a, b) => a.localeCompare(b, "id"));
    return [
      { value: ALL, label: "Semua jenis" },
      ...types.map((t) => ({ value: t, label: `${t} (${counts.get(t)})` })),
      ...(counts.has(NO_TYPE)
        ? [{ value: NO_TYPE, label: `Tanpa jenis (${counts.get(NO_TYPE)})` }]
        : []),
    ];
  }, [documents]);

  const statusOptions = useMemo(() => {
    const count = (s: DocumentStatus) =>
      documents.filter((d) => d.status === s).length;
    return [
      { value: ALL, label: "Semua status" },
      ...(Object.keys(statusStyle) as DocumentStatus[]).map((s) => ({
        value: s,
        label: `${statusStyle[s].label} (${count(s)})`,
      })),
    ];
  }, [documents]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    return documents.filter((d) => {
      if (status !== ALL && d.status !== status) return false;
      const t = d.regulation_type?.trim() || NO_TYPE;
      if (docType !== ALL && t !== docType) return false;
      if (
        q &&
        !normalize(
          `${d.title} ${d.file_name} ${d.regulation_type ?? ""}`,
        ).includes(q)
      )
        return false;
      return true;
    });
  }, [documents, query, status, docType]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  // dihitung, bukan disimpan: setelah hapus atau filter, halaman otomatis kembali ke batas terakhir
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);
  const filterActive = query !== "" || status !== ALL || docType !== ALL;

  // setiap filter berubah, mulai lagi dari halaman pertama
  function changeFilter(apply: () => void) {
    apply();
    setPage(1);
  }

  function goToPage(p: number) {
    setPage(p);
    // halaman baru dibaca dari atas tabel, bukan dari posisi tombol halaman di bawah
    tableTop.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function resetFilters() {
    changeFilter(() => {
      setQuery("");
      setStatus(ALL);
      setDocType(ALL);
    });
  }

  let summary = "Memuat dokumen…";
  if (!loading) {
    summary =
      filtered.length === 0
        ? `0 dari ${documents.length} dokumen`
        : `${start + 1}–${start + pageItems.length} dari ${filtered.length} dokumen`;
    if (filterActive && filtered.length > 0)
      summary += ` (difilter dari ${documents.length})`;
  }

  return (
    <div className="flex min-h-0 flex-1">
      <AppDrawer open={menuOpen} onClose={closeMenu} />
      <DrawerButton open={menuOpen} onClick={() => setMenuOpen(true)} />
      <div className="no-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pt-20 pb-8 md:px-6 md:pt-10 md:pb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              Dokumen
            </h1>
            <p className="mt-2 max-w-2xl text-[15px] text-muted">
              Dokumen yang jadi sumber jawaban chat. Dokumen baru bisa
              ditanyakan setelah statusnya Siap.
            </p>
          </div>

          <UploadForm onUploaded={refresh} />

          {/* scroll-mt: saat pindah halaman, bagian atas tidak tertutup nav yang mengambang */}
          <section
            ref={tableTop}
            className="scroll-mt-20 space-y-3"
            aria-label="Daftar dokumen"
          >
            {/* HP: cari satu baris penuh, status dan jenis berdampingan di bawahnya */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_12rem_auto]">
              <label className="relative col-span-2 sm:col-span-1">
                <span className="sr-only">Cari dokumen</span>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted"
                >
                  <circle cx="7" cy="7" r="4.5" />
                  <path d="m10.5 10.5 3 3" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => changeFilter(() => setQuery(e.target.value))}
                  placeholder="Cari judul, nama file, atau jenis"
                  className="h-10 w-full rounded-xl border-[2.5px] border-ink bg-surface pr-4 pl-10 text-base placeholder:text-muted focus:border-ledger focus:outline-none md:text-sm"
                />
              </label>
              <Select
                variant="field"
                ariaLabel="Filter status"
                options={statusOptions}
                value={status}
                onChange={(v) =>
                  changeFilter(() => setStatus(v as StatusFilter))
                }
              />
              <Select
                variant="field"
                ariaLabel="Filter jenis"
                options={typeOptions}
                value={docType}
                onChange={(v) => changeFilter(() => setDocType(v))}
                align="right"
              />
              {filterActive ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="col-span-2 h-10 rounded-xl sm:col-span-1 px-4 text-sm font-medium text-muted transition-colors hover:bg-ledger-soft hover:text-ink"
                >
                  Reset
                </button>
              ) : (
                // menjaga lebar kolom supaya filter tidak bergeser saat tombol Reset muncul
                <span
                  className="hidden w-[4.75rem] sm:block"
                  aria-hidden="true"
                />
              )}
            </div>

            <h2 className="text-sm font-semibold text-muted" aria-live="polite">
              {summary}
            </h2>

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
              >
                {error}
              </p>
            )}

            {!loading && (
              <DocumentTable
                documents={pageItems}
                emptyMessage={
                  documents.length === 0
                    ? "Belum ada dokumen. Upload dokumen pertama di atas."
                    : "Tidak ada dokumen yang cocok dengan filter."
                }
                onDelete={deleteDocument}
              />
            )}

            {!loading && filtered.length > 0 && (
              <div className="flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
                <div className="flex items-center gap-1 text-sm text-muted">
                  <span>Baris per halaman</span>
                  <Select
                    ariaLabel="Baris per halaman"
                    options={PAGE_SIZES.map((n) => ({
                      value: String(n),
                      label: String(n),
                    }))}
                    value={String(pageSize)}
                    onChange={(v) => changeFilter(() => setPageSize(Number(v)))}
                    placement="up"
                  />
                </div>
                <Pagination
                  page={currentPage}
                  pageCount={pageCount}
                  onChange={goToPage}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
