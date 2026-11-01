"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import type { ChatMessage, ChatSession, Source } from "@/lib/types";
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

  const selectSession = useCallback(async (id: string) => {
    latestSession.current = id;
    setActiveId(id);
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
  }, []);

  const newChat = useCallback(() => {
    latestSession.current = null;
    setActiveId(null);
    setMessages([]);
    setOpenSource(null);
    setError(null);
  }, []);

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
        const res = await api.ask(question, activeId ?? undefined);
        setMessages((m) => [
          ...m,
          {
            id: `local-${Date.now()}-answer`,
            session_id: res.session_id,
            role: "assistant",
            content: res.answer,
            sources: res.sources,
            created_at: new Date().toISOString(),
          },
        ]);
        if (activeId === null) {
          latestSession.current = res.session_id;
          setActiveId(res.session_id);
          setSessionsKey((k) => k + 1);
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
    [activeId],
  );

  return (
    <div className="flex min-h-0 flex-1">
      <SessionSidebar
        sessions={sessions}
        activeId={activeId}
        disabled={pending}
        onSelect={selectSession}
        onNew={newChat}
      />

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* di layar kecil sidebar disembunyikan, jadi tombol chat baru ditaruh di sini */}
        <div className="flex items-center justify-between border-b border-rule bg-surface px-4 py-2 md:hidden">
          <span className="text-sm text-muted">
            {activeId ? "Percakapan" : "Chat baru"}
          </span>
          <button
            type="button"
            onClick={newChat}
            disabled={pending}
            className="rounded-md border border-rule px-3 py-1 text-sm font-medium disabled:opacity-50"
          >
            + Chat baru
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6">
            {loadingMessages ? (
              <p className="text-sm text-muted">Memuat percakapan…</p>
            ) : messages.length === 0 && !pending ? (
              <EmptyState disabled={pending} onAsk={send} />
            ) : (
              <MessageList messages={messages} pending={pending} onOpenSource={setOpenSource} />
            )}
          </div>
        </div>

        <div className="bg-paper">
          <div className="mx-auto w-full max-w-3xl px-4 pt-2 pb-4 md:px-6">
            {error && (
              <p role="alert" className="mb-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
            <ChatInput disabled={pending || loadingMessages} onSend={send} />
            <p className="mt-2 text-center text-xs text-muted">
              Enter untuk kirim, Shift+Enter untuk baris baru. Periksa kembali kutipan sebelum dipakai di laporan audit.
            </p>
          </div>
        </div>
      </section>

      <SourcePanel source={openSource} onClose={() => setOpenSource(null)} />
    </div>
  );
}

// contoh pertanyaan untuk memulai; diklik langsung dikirim
const EXAMPLES = [
  "Apa saja hak subjek data pribadi?",
  "Berapa lama batas waktu pemenuhan permintaan subjek data?",
  "Apa sanksi administratif bagi pengendali data yang melanggar?",
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
        Tanya regulasi, dapat jawaban dengan pasalnya.
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
        Jawaban hanya diambil dari dokumen yang sudah diupload. Setiap kalimat diberi nomor
        sumber, klik nomornya untuk membaca kutipan pasal aslinya.
      </p>

      <h2 className="mt-10 text-sm font-semibold text-muted">Coba tanyakan</h2>
      <ul className="mt-3 divide-y divide-rule border-y border-rule">
        {EXAMPLES.map((q) => (
          <li key={q}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onAsk(q)}
              className="group flex w-full items-center justify-between gap-4 py-3 text-left font-serif text-lg transition-colors hover:text-ledger disabled:opacity-50"
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
