import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { StoredDocument } from "@/lib/types";
import { TickMark } from "../tick-mark";

type Props = {
  documents: StoredDocument[];
  // kosong = semua dokumen
  selected: string[];
  disabled: boolean;
  onChange: (ids: string[]) => void;
};

function buttonLabel(documents: StoredDocument[], selected: string[]) {
  if (selected.length === 0) return "Semua dokumen";
  if (selected.length > 1) return `${selected.length} dokumen`;
  return documents.find((d) => d.id === selected[0])?.title ?? "1 dokumen";
}

// membatasi pencarian jawaban ke dokumen tertentu; daftar tetap terbuka supaya bisa memilih beberapa
export function DocumentSelect({ documents, selected, disabled, onChange }: Props) {
  const [open, setOpen] = useState(false);
  // baris yang disorot: 0 = "Semua dokumen", 1 dst = dokumen; fokus tetap di tombol
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const optionId = (i: number) => `${id}-option-${i}`;
  const showList = open && !disabled;
  const optionCount = documents.length + 1;

  useEffect(() => {
    if (!showList) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [showList]);

  // daftar bisa panjang, jadi baris yang disorot keyboard harus tetap terlihat
  useEffect(() => {
    if (showList) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showList, active]);

  function toggle(i: number) {
    if (i === 0) {
      onChange([]);
      return;
    }
    const docId = documents[i - 1].id;
    onChange(selected.includes(docId) ? selected.filter((s) => s !== docId) : [...selected, docId]);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!showList) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        setActive(0);
        setOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => (i + 1) % optionCount);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => (i - 1 + optionCount) % optionCount);
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(optionCount - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        toggle(active);
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  const optionClass = (i: number) =>
    `flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm ${
      i === active ? "bg-ledger-soft" : ""
    }`;

  return (
    <div ref={root} className="relative min-w-0">
      <button
        type="button"
        role="combobox"
        aria-label="Dokumen sumber jawaban"
        aria-haspopup="listbox"
        aria-expanded={showList}
        aria-controls={`${id}-list`}
        aria-activedescendant={showList ? optionId(active) : undefined}
        disabled={disabled}
        onClick={() => {
          setActive(0);
          setOpen(!showList);
        }}
        onKeyDown={onKeyDown}
        className="block h-8 max-w-full truncate rounded-lg px-2 text-sm text-ink transition-colors hover:bg-ledger-soft disabled:opacity-50"
      >
        {buttonLabel(documents, selected)}
      </button>

      {showList && (
        // solid, bukan .glass: sama seperti daftar model, dan judul panjang tetap mudah dibaca
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label="Dokumen sumber jawaban"
          aria-multiselectable="true"
          className="no-scrollbar absolute bottom-full left-0 z-50 mb-2 max-h-72 w-80 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border-[2.5px] border-ink bg-surface p-1.5 shadow-xl"
        >
          <li
            id={optionId(0)}
            role="option"
            aria-selected={selected.length === 0}
            onPointerEnter={() => setActive(0)}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggle(0)}
            className={optionClass(0)}
          >
            <span className="truncate font-medium">Semua dokumen</span>
            {selected.length === 0 && <TickMark className="size-3.5 shrink-0" />}
          </li>
          {documents.map((doc, i) => (
            <li
              key={doc.id}
              id={optionId(i + 1)}
              role="option"
              aria-selected={selected.includes(doc.id)}
              onPointerEnter={() => setActive(i + 1)}
              // fokus tetap di tombol, jadi keyboard terus berfungsi setelah memilih
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggle(i + 1)}
              className={optionClass(i + 1)}
            >
              <span className="truncate">{doc.title}</span>
              {selected.includes(doc.id) && <TickMark className="size-3.5 shrink-0" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
