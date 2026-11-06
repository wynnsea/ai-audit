import { useLayoutEffect, useRef } from "react";
import type { ChatMessage, Source } from "@/lib/types";
import { MessageBubble } from "./message-bubble";

type Props = {
  messages: ChatMessage[];
  pending: boolean;
  onOpenSource: (source: Source) => void;
};

export function MessageList({ messages, pending, onOpenSource }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  // komponen ini dipasang ulang setiap membuka sesi, jadi false berarti percakapan baru dibuka
  const opened = useRef(false);

  // gulir ke pesan terbaru setiap ada pesan baru atau saat mulai menunggu jawaban.
  // Saat percakapan dibuka langsung lompat sebelum digambar, supaya tidak terlihat bergulir dari atas.
  useLayoutEffect(() => {
    endRef.current?.scrollIntoView({ behavior: opened.current ? "smooth" : "auto", block: "end" });
    opened.current = true;
  }, [messages.length, pending]);

  return (
    <div className="space-y-8">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} onOpenSource={onOpenSource} />
      ))}
      {pending && (
        <div className="flex items-center gap-3 text-sm text-muted" role="status">
          <span className="flex gap-1" aria-hidden="true">
            <span className="size-1.5 animate-bounce rounded-full bg-ledger [animation-delay:-0.3s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-ledger [animation-delay:-0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-ledger" />
          </span>
          Menyusun jawaban…
        </div>
      )}
      {/* scroll-mb-6: sisakan jarak yang sama dengan padding bawah daftar pesan */}
      <div ref={endRef} className="scroll-mb-6" />
    </div>
  );
}
