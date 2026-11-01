import { useEffect, useRef } from "react";
import type { ChatMessage, Source } from "@/lib/types";
import { MessageBubble } from "./message-bubble";

type Props = {
  messages: ChatMessage[];
  pending: boolean;
  onOpenSource: (source: Source) => void;
};

export function MessageList({ messages, pending, onOpenSource }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  // gulir ke pesan terbaru setiap ada pesan baru atau saat mulai menunggu jawaban
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
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
          Mencari pasal yang relevan dan menyusun jawaban…
        </div>
      )}
      <div ref={endRef} />
    </div>
  );
}
