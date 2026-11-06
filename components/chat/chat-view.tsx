"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { AuditDocument, ChatMessage, ChatSession, Source } from "@/lib/types";
import { ChatInput } from "./chat-input";
import { MessageList } from "./message-list";
import { SessionSidebar } from "./session-sidebar";
import { SourcePanel } from "./source-panel";

export function ChatView() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  // dinaikkan setiap kali daftar sesi perlu diambil ulang (misal setelah sesi baru dibuat)
  const [sessionsKey, setSessionsKey] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSource, setOpenSource] = useState<Source | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState<string | null>(null);
  const [documents, setDocuments] = useState<AuditDocument[]>([]);
  // dokumen yang boleh dipakai menjawab; kosong = semua dokumen
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const closeHistory = useCallback(() => setHistoryOpen(false), []);

  // sesi terakhir yang diklik; respons dari klik sebelumnya yang datang belakangan diabaikan
  const latestSession = useRef<string | null>(null);

  useEffect(() => {
    let ignore = false;
    api
      .listSessions()
      .then((s) => {
        if (!ignore) setSessions(s);
      })
      .catch(() => {
        // sidebar kosong tidak menghalangi chat, jadi cukup diabaikan
      });
    return () => {
      ignore = true;
    };
  }, [sessionsKey]);

  useEffect(() => {
    let ignore = false;
    api
      .listModels()
      .then((list) => {
        if (ignore) return;
        setModels(list);
        setModel(list[0] ?? null);
      })
      .catch(() => {
        // tanpa daftar, pilihan disembunyikan dan service memakai model default
      });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    api
      .listDocuments()
      .then((docs) => {
        if (!ignore) setDocuments(docs.filter((d) => d.status === "ready"));
      })
      .catch(() => {
        // tanpa daftar, pilihan disembunyikan dan pencarian memakai semua dokumen
      });
    return () => {
      ignore = true;
    };
  }, []);

  const selectSession = useCallback(async (id: string) => {
    latestSession.current = id;
    setActiveId(id);
    // pilihan dokumen ikut kembali, supaya pertanyaan lanjutan tidak melebar ke dokumen lain
    setDocumentIds(sessions.find((s) => s.id === id)?.document_ids ?? []);
    setOpenSource(null);
    setError(null);
    setLoadingMessages(true);
    try {
      const history = await api.listMessages(id);
      if (latestSession.current === id) setMessages(history);
    } catch (e) {
      if (latestSession.current === id) setError(errorMessage(e, "Gagal memuat riwayat chat"));
    } finally {
      if (latestSession.current === id) setLoadingMessages(false);
    }
  }, [sessions]);

  const newChat = useCallback(() => {
    latestSession.current = null;
    setActiveId(null);
    setDocumentIds([]);
    setMessages([]);
    setOpenSource(null);
    setError(null);
  }, []);

  const renameSession = useCallback(async (id: string, title: string): Promise<boolean> => {
    try {
      const res = await api.renameSession(id, title);
      setSessions((list) => list.map((s) => (s.id === id ? { ...s, title: res.title } : s)));
      return true;
    } catch (e) {
      setError(errorMessage(e, "Gagal mengganti nama chat"));
      return false;
    }
  }, []);

  const deleteSession = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await api.deleteSession(id);
        setSessions((list) => list.filter((s) => s.id !== id));
        // chat yang sedang dibuka ikut dihapus, jadi layar kembali ke chat baru
        if (id === activeId) newChat();
        return true;
      } catch (e) {
        setError(errorMessage(e, "Gagal menghapus chat"));
        return false;
      }
    },
    [activeId, newChat],
  );

  // mengembalikan false kalau gagal, supaya input bisa mengembalikan teks pertanyaan
  const send = useCallback(
    async (question: string): Promise<boolean> => {
      const userMessage: ChatMessage = {
        id: `local-${Date.now()}`,
        session_id: activeId ?? "",
        role: "user",
        content: question,
        created_at: new Date().toISOString(),
      };
      // pertanyaan langsung tampil tanpa menunggu jawaban (optimistic update)
      setMessages((m) => [...m, userMessage]);
      setPending(true);
      setError(null);

      try {
        const res = await api.ask(question, activeId ?? undefined, model ?? undefined, documentIds);
        setMessages((m) => [
          ...m,
          {
            id: `local-${Date.now()}-answer`,
            session_id: res.session_id,
            role: "assistant",
            content: res.answer,
            sources: res.sources,
            model: res.model,
            created_at: new Date().toISOString(),
          },
        ]);
        if (activeId === null) {
          latestSession.current = res.session_id;
          setActiveId(res.session_id);
          setSessionsKey((k) => k + 1);
        } else {
          // sesi yang baru dipakai naik ke atas, sama seperti urutan dari server
          setSessions((list) => {
            const current = list.find((s) => s.id === activeId);
            if (!current) return list;
            const updated = {
              ...current,
              document_ids: documentIds,
              last_message_at: new Date().toISOString(),
            };
            return [updated, ...list.filter((s) => s.id !== activeId)];
          });
        }
        return true;
      } catch (e) {
        setMessages((m) => m.filter((msg) => msg.id !== userMessage.id));
        setError(errorMessage(e, "Gagal mendapatkan jawaban"));
        return false;
      } finally {
        setPending(false);
      }
    },
    [activeId, model, documentIds],
  );

  return (
    <div className="flex min-h-0 flex-1">
      <SessionSidebar
        sessions={sessions}
        activeId={activeId}
        disabled={pending}
        mobileOpen={historyOpen}
        onCloseMobile={closeHistory}
        onSelect={(id) => {
          closeHistory();
          selectSession(id);
        }}
        onNew={() => {
          closeHistory();
          newChat();
        }}
        onRename={renameSession}
        onDelete={deleteSession}
      />

      <section className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        {/* di layar kecil riwayat dan tombol chat baru ada di dalam laci */}
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          aria-expanded={historyOpen}
          className="glass absolute top-3 right-3 z-20 h-12 rounded-full px-4 text-sm font-medium md:hidden"
        >
          Riwayat
        </button>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 pt-20 pb-6 md:px-6 md:pt-10">
            {loadingMessages ? (
              <p className="text-sm text-muted">Memuat percakapan…</p>
            ) : messages.length === 0 && !pending ? (
              <EmptyState disabled={pending} onAsk={send} />
            ) : (
              <MessageList messages={messages} pending={pending} onOpenSource={setOpenSource} />
            )}
          </div>
        </div>

        {/* tidak mengambang: baris catatan dan model tidak punya latar, jadi pesan tidak boleh lewat di belakangnya */}
        <div className="relative z-10 shrink-0">
          <div className="mx-auto w-full max-w-3xl px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:px-6">
            {error && (
              <p role="alert" className="mb-2 rounded-2xl bg-danger-soft px-4 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <ChatInput
              disabled={pending || loadingMessages}
              models={models}
              model={model}
              onModelChange={setModel}
              documents={documents}
              documentIds={documentIds}
              onDocumentsChange={setDocumentIds}
              onSend={send}
            />
          </div>
        </div>
      </section>

      <SourcePanel source={openSource} onClose={() => setOpenSource(null)} />
    </div>
  );
}

// contoh pertanyaan untuk memulai; diklik langsung dikirim
const EXAMPLES = [
  "Apa saja kewajiban utama yang harus dipenuhi?",
  "Berapa batas waktu pelaporan yang ditetapkan?",
  "Apa sanksi jika ketentuan dilanggar?",
];

function EmptyState({
  disabled,
  onAsk,
}: {
  disabled: boolean;
  onAsk: (question: string) => Promise<boolean>;
}) {
  return (
    <div className="pt-6 md:pt-14">
      <h1 className="max-w-xl font-serif text-4xl leading-tight font-semibold tracking-tight md:text-5xl">
        Tanya dokumen, dapat jawaban dengan sumbernya.
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
        Jawaban hanya diambil dari dokumen yang sudah diupload. Setiap kalimat diberi nomor
        sumber, klik nomornya untuk membaca kutipan aslinya.
      </p>

      <h2 className="mt-10 text-sm font-semibold text-muted">Coba tanyakan</h2>
      <ul className="glass mt-3 divide-y divide-rule overflow-hidden rounded-[28px]">
        {EXAMPLES.map((q) => (
          <li key={q}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAsk(q)}
              className="group flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left font-serif text-lg transition-colors hover:bg-ledger-soft disabled:opacity-50"
            >
              {q}
              <span aria-hidden="true" className="font-sans text-muted group-hover:text-ledger">
                ↵
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
