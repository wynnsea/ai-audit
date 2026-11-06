import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { modelLabel } from "@/lib/format";
import { TickMark } from "../tick-mark";

type Props = {
  models: string[];
  model: string | null;
  disabled: boolean;
  onChange: (model: string) => void;
};

// pengganti <select> bawaan, yang daftar pilihannya tidak bisa diberi gaya sesuai tampilan aplikasi
export function ModelSelect({ models, model, disabled, onChange }: Props) {
  const [open, setOpen] = useState(false);
  // baris yang sedang disorot; fokus tetap di tombol, jadi posisi ini dipakai untuk keyboard
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const optionId = (i: number) => `${id}-option-${i}`;
  const showList = open && !disabled;

  useEffect(() => {
    if (!showList) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [showList]);

  function openList() {
    setActive(Math.max(0, models.indexOf(model ?? "")));
    setOpen(true);
  }

  function choose(m: string) {
    onChange(m);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!showList) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => (i + 1) % models.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => (i - 1 + models.length) % models.length);
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(models.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(models[active]);
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

  return (
    <div ref={root} className="relative min-w-0">
      <button
        type="button"
        role="combobox"
        aria-label="Model AI"
        aria-haspopup="listbox"
        aria-expanded={showList}
        aria-controls={`${id}-list`}
        aria-activedescendant={showList ? optionId(active) : undefined}
        disabled={disabled}
        onClick={() => (showList ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className="block h-8 max-w-full truncate rounded-lg px-2 text-sm text-ink transition-colors hover:bg-ledger-soft disabled:opacity-50"
      >
        {model ? modelLabel(model) : "Pilih model"}
      </button>

      {showList && (
        // solid, bukan .glass: blur bersarang di dalam panel kaca tidak membiaskan isi halaman
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label="Model AI"
          className="absolute right-0 bottom-full z-50 mb-2 w-64 max-w-[calc(100vw-3rem)] rounded-[20px] border border-rule bg-surface p-1.5 shadow-xl"
        >
          {models.map((m, i) => (
            <li
              key={m}
              id={optionId(i)}
              role="option"
              aria-selected={m === model}
              onPointerEnter={() => setActive(i)}
              // fokus tetap di tombol, jadi keyboard terus berfungsi setelah memilih
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(m)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm ${
                i === active ? "bg-ledger-soft" : ""
              }`}
            >
              <span className="truncate">{modelLabel(m)}</span>
              {m === model && <TickMark className="size-3.5 shrink-0" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
