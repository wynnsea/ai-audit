"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type {
  StoredDocument,
  ChatMessage,
  ChatSession,
  Source,
} from "@/lib/types";
import { DrawerButton } from "../app-drawer";
import { ChatInput, type ChatInputHandle } from "./chat-input";
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
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  // dokumen yang boleh dipakai menjawab; kosong = semua dokumen
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const closeHistory = useCallback(() => setHistoryOpen(false), []);
  const input = useRef<ChatInputHandle>(null);
  const editQuestion = useCallback(
    (text: string) => input.current?.fill(text),
    [],
  );

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

  const selectSession = useCallback(
    async (id: string) => {
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
        if (latestSession.current === id)
          setError(errorMessage(e, "Gagal memuat riwayat chat"));
      } finally {
        if (latestSession.current === id) setLoadingMessages(false);
      }
    },
    [sessions],
  );

  const newChat = useCallback(() => {
    latestSession.current = null;
    setActiveId(null);
    setDocumentIds([]);
    setMessages([]);
    setOpenSource(null);
    setError(null);
  }, []);

  const renameSession = useCallback(
    async (id: string, title: string): Promise<boolean> => {
      try {
        const res = await api.renameSession(id, title);
        setSessions((list) =>
          list.map((s) => (s.id === id ? { ...s, title: res.title } : s)),
        );
        return true;
      } catch (e) {
        setError(errorMessage(e, "Gagal mengganti nama chat"));
        return false;
      }
    },
    [],
  );

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
        const res = await api.ask(
          question,
          activeId ?? undefined,
          model ?? undefined,
          documentIds,
        );
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
        {/* di layar kecil menu, tombol chat baru, dan riwayat ada di dalam laci */}
        <DrawerButton open={historyOpen} onClick={() => setHistoryOpen(true)} />

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 pt-20 pb-6 md:px-6 md:pt-10">
            {loadingMessages ? (
              <p className="text-sm text-muted">Memuat percakapan…</p>
            ) : messages.length === 0 && !pending ? (
              <EmptyState disabled={pending} onAsk={send} />
            ) : (
              <MessageList
                messages={messages}
                pending={pending}
                onOpenSource={setOpenSource}
                onEdit={editQuestion}
              />
            )}
          </div>
        </div>

        {/* tidak mengambang: baris catatan dan model tidak punya latar, jadi pesan tidak boleh lewat di belakangnya */}
        <div className="relative z-10 shrink-0">
          <div className="mx-auto w-full max-w-3xl px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:px-6">
            {error && (
              <p
                role="alert"
                className="mb-2 rounded-2xl bg-danger-soft px-4 py-2 text-sm text-danger"
              >
                {error}
              </p>
            )}
            <ChatInput
              ref={input}
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

// contoh pertanyaan untuk list MBG (My Bini Gw); diklik langsung dikirim
const EXAMPLES = [
  { tag: "List", question: "Tampilin list MBG" },
  { tag: "Genre", question: "MBG mana aja yang dari anime romcom?" },
  { tag: "Alasan", question: "Siapa MBG #1 dan kenapa gw suka dia?" },
];

function EmptyState({
  disabled,
  onAsk,
}: {
  disabled: boolean;
  onAsk: (question: string) => Promise<boolean>;
}) {
  return (
    <div className="pt-8 md:pt-14">
      {/* satu-satunya elemen yang "berteriak": kotak lime = warna bukti, sama dengan nomor sitasi */}
      <h1 className="max-w-2xl text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-5xl md:text-6xl">
        Mau lihat bini yang mana{" "}
        <span className="mt-2 inline-block -rotate-2 rounded-md border-[3px] border-ink bg-lime px-3 pb-1 shadow-[5px_5px_0_0_#000]">
          hari ini? ♡
        </span>
      </h1>
      <p className="mt-6 max-w-xl border-l-[3px] border-violet pl-4 text-base leading-relaxed text-ink">
        <strong>MBG</strong> = My Bini Gw, daftar karakter anime favorit lo.
        Upload list-nya di halaman Dokumen, lalu tanya apa aja soal mereka di
        sini. Setiap jawaban disertai nomor sumber dari list lo.
      </p>

      <h2 className="mt-10 text-sm font-bold">Coba tanya</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-3">
        {EXAMPLES.map(({ tag, question }) => (
          <li key={question}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAsk(question)}
              className="neo-btn group flex h-full w-full flex-col items-start gap-2 rounded-xl bg-surface p-4 text-left disabled:opacity-50 sm:gap-3"
            >
              <span className="rounded-md border-2 border-ink bg-paper px-2 py-0.5 text-xs font-bold">
                {tag}
              </span>
              <span className="text-base leading-snug font-semibold">
                {question}
              </span>
              <span
                aria-hidden="true"
                className="mt-auto hidden self-end font-sans text-muted group-hover:text-ledger sm:block"
              >
                ↵
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
