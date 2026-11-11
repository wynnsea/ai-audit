import { useImperativeHandle, useRef, useState, type KeyboardEvent, type Ref } from "react";
import type { StoredDocument } from "@/lib/types";
import { DocumentSelect } from "./document-select";
import { ModelSelect } from "./model-select";

// dipanggil ChatView lewat ref, misal saat tombol edit pertanyaan diklik
export type ChatInputHandle = {
  fill: (text: string) => void;
};

type Props = {
  ref?: Ref<ChatInputHandle>;
  disabled: boolean;
  models: string[];
  model: string | null;
  onModelChange: (model: string) => void;
  documents: StoredDocument[];
  documentIds: string[];
  onDocumentsChange: (ids: string[]) => void;
  // true kalau terkirim; false kalau gagal, maka teks dikembalikan ke kotak input
  onSend: (question: string) => Promise<boolean>;
};

export function ChatInput({
  ref,
  disabled,
  models,
  model,
  onModelChange,
  documents,
  documentIds,
  onDocumentsChange,
  onSend,
}: Props) {
  const [value, setValue] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    fill(text: string) {
      setValue(text);
      // tunggu teks masuk dulu, baru fokus dan taruh kursor di akhir
      requestAnimationFrame(() => {
        const el = textarea.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(text.length, text.length);
      });
    },
  }));

  async function submit() {
    const question = value.trim();
    if (!question || disabled) return;
    setValue("");
    const sent = await onSend(question);
    if (!sent) setValue(question);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter = kirim, Shift+Enter = baris baru. isComposing: jangan kirim saat IME masih mengetik
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="glass flex items-end gap-1 rounded-2xl p-1 transition-colors">
        <label htmlFor="question" className="sr-only">
          Pertanyaan
        </label>
        {/* field-sizing-content: kotak ikut tinggi teks sampai max-h, lalu digulir */}
        <textarea
          ref={textarea}
          id="question"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Tanya soal MBG lo…"
          className="no-scrollbar field-sizing-content max-h-40 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-3 py-2 text-base placeholder:text-muted focus:outline-none md:text-[15px]"
        />
        <button
          type="submit"
          aria-label="Kirim"
          disabled={disabled || value.trim() === ""}
          className="neo-btn grid size-10 shrink-0 place-items-center rounded-lg bg-sky text-ink disabled:border-transparent disabled:bg-transparent disabled:text-muted">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-4">
            <path d="M13.5 3v5a2 2 0 0 1-2 2h-9M5.5 7l-3 3 3 3" />
          </svg>
        </button>
      </form>

      {/* min-w-0: judul dokumen yang panjang dipotong, bukan mendorong pilihan model keluar layar */}
      <div className="mt-1 flex items-center justify-between gap-2">
        {documents.length > 0 && (
          <DocumentSelect
            documents={documents}
            selected={documentIds}
            disabled={disabled}
            onChange={onDocumentsChange}
          />
        )}
        {models.length > 1 && (
          <div className="ml-auto shrink-0">
            <ModelSelect
              models={models}
              model={model}
              disabled={disabled}
              onChange={onModelChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}
