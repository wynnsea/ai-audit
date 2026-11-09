import { useEffect, useState } from "react";
import { copyText } from "@/lib/clipboard";
import { TickMark } from "../tick-mark";

const buttonClass =
  "grid size-8 place-items-center rounded-full text-muted transition-colors hover:bg-ledger-soft hover:text-ink";

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => setCopied(await copyText(text))}
      aria-label={copied ? "Tersalin" : label}
      title={copied ? "Tersalin" : label}
      className={buttonClass}
    >
      {copied ? (
        <TickMark className="size-3.5 text-ledger" />
      ) : (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
          aria-hidden="true"
          className="size-4"
        >
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
          <path d="M10.5 5.5V4a1.5 1.5 0 0 0-1.5-1.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5" />
        </svg>
      )}
      {/* diumumkan pembaca layar saat berhasil menyalin */}
      <span className="sr-only" role="status">
        {copied ? "Tersalin" : ""}
      </span>
    </button>
  );
}

export function EditButton({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label="Edit pertanyaan"
      title="Edit pertanyaan"
      className={`${buttonClass} disabled:opacity-40 disabled:hover:bg-transparent`}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-4"
      >
        <path d="M10.5 2.5l3 3L6 13H3v-3l7.5-7.5zM9 4l3 3" />
      </svg>
    </button>
  );
}
