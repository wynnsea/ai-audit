import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { TickMark } from "./tick-mark";

export type SelectOption = { value: string; label: string };

type Props = {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
  ariaLabel: string;
  disabled?: boolean;
  placeholder?: string;
  // "up": daftar membuka ke atas (dipakai di bawah layar, misal kotak chat)
  placement?: "up" | "down";
  align?: "left" | "right";
  // "inline": teks kecil tanpa bingkai; "field": berbingkai seperti kolom input, untuk filter
  variant?: "inline" | "field";
};

// pengganti <select> bawaan, yang daftar pilihannya tidak bisa diberi gaya sesuai tampilan aplikasi
export function Select({
  options,
  value,
  onChange,
  ariaLabel,
  disabled = false,
  placeholder = "Pilih",
  placement = "down",
  align = "left",
  variant = "inline",
}: Props) {
  const [open, setOpen] = useState(false);
  // baris yang sedang disorot; fokus tetap di tombol, jadi posisi ini dipakai untuk keyboard
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const optionId = (i: number) => `${id}-option-${i}`;
  const showList = open && !disabled;
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!showList) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [showList]);

  // daftar bisa panjang (misal jenis dokumen), jadi baris yang disorot keyboard harus tetap terlihat
  useEffect(() => {
    if (showList) document.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showList, active]);

  function openList() {
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  }

  function choose(v: string) {
    onChange(v);
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
        setActive((i) => (i + 1) % options.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => (i - 1 + options.length) % options.length);
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(options[active].value);
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

  const buttonClass =
    variant === "field"
      ? "flex h-10 w-full items-center justify-between gap-2 rounded-xl border-[2.5px] border-ink bg-surface px-4 text-left text-sm text-ink transition-colors hover:bg-ledger-soft disabled:opacity-50"
      : "block h-8 max-w-full truncate rounded-lg px-2 text-sm text-ink transition-colors hover:bg-ledger-soft disabled:opacity-50";

  return (
    <div ref={root} className={`relative min-w-0 ${variant === "field" ? "w-full" : ""}`}>
      <button
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={showList}
        aria-controls={`${id}-list`}
        aria-activedescendant={showList ? optionId(active) : undefined}
        disabled={disabled}
        onClick={() => (showList ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={buttonClass}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        {variant === "field" && (
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`size-3.5 shrink-0 text-muted transition-transform ${showList ? "rotate-180" : ""}`}
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        )}
      </button>

      {showList && (
        // solid, bukan .glass: blur bersarang di dalam panel kaca tidak membiaskan isi halaman
        <ul
          id={`${id}-list`}
          role="listbox"
          aria-label={ariaLabel}
          className={`no-scrollbar absolute z-50 max-h-72 w-64 max-w-[calc(100vw-3rem)] overflow-y-auto rounded-xl border-[2.5px] border-ink bg-surface p-1.5 shadow-xl ${
            placement === "up" ? "bottom-full mb-2" : "top-full mt-2"
          } ${align === "right" ? "right-0" : "left-0"} ${variant === "field" ? "min-w-full" : ""}`}
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              id={optionId(i)}
              role="option"
              aria-selected={o.value === value}
              onPointerEnter={() => setActive(i)}
              // fokus tetap di tombol, jadi keyboard terus berfungsi setelah memilih
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(o.value)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm ${
                i === active ? "bg-ledger-soft" : ""
              }`}
            >
              <span className="truncate">{o.label}</span>
              {o.value === value && <TickMark className="size-3.5 shrink-0" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
