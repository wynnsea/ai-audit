import { useState, type KeyboardEvent } from "react";

type Props = {
  disabled: boolean;
  // true kalau terkirim; false kalau gagal, maka teks dikembalikan ke kotak input
  onSend: (question: string) => Promise<boolean>;
};

export function ChatInput({ disabled, onSend }: Props) {
  const [value, setValue] = useState("");

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
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex items-end gap-2 rounded-xl border border-rule bg-surface p-2 shadow-sm transition-colors focus-within:border-ledger"
    >
      <label htmlFor="question" className="sr-only">
        Pertanyaan
      </label>
      <textarea
        id="question"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        placeholder="Tanyakan isi regulasi atau standar…"
        className="min-h-[48px] flex-1 resize-none bg-transparent px-2 py-1.5 text-[15px] placeholder:text-muted focus:outline-none"
      />
      <button
        type="submit"
        disabled={disabled || value.trim() === ""}
        className="h-10 rounded-lg bg-ledger px-4 text-sm font-semibold text-surface transition-colors hover:bg-ledger-strong disabled:opacity-40"
      >
        Kirim
      </button>
    </form>
  );
}
