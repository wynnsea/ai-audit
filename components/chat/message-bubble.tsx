import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { modelLabel } from "@/lib/format";
import type { ChatMessage, Source } from "@/lib/types";
import { CopyButton, EditButton } from "./message-actions";

// "[3]" di jawaban diubah jadi link Markdown "[3](#cite-3)" supaya bisa dirender sebagai tombol.
// (?!\() mencegah link Markdown asli "[teks](url)" ikut berubah.
const CITATION = /\[(\d+)\](?!\()/g;
const CITE_HREF = "#cite-";

function linkCitations(text: string) {
  return text.replace(CITATION, `[$1](${CITE_HREF}$1)`);
}

// hanya sumber yang dikutip di jawaban; kalau model tidak memberi sitasi, semua ditampilkan
function citedSources(content: string, sources: Source[]) {
  const numbers = new Set(Array.from(content.matchAll(CITATION), (m) => Number(m[1])));
  const cited = sources.filter((s) => numbers.has(s.number));
  return cited.length > 0 ? cited : sources;
}

// "BAB VI ... > Bagian Kedua ... > Pasal 40" → "Pasal 40"
export function shortSection(section: string) {
  return section.split(" > ").at(-1) || section;
}

type Props = {
  message: ChatMessage;
  onOpenSource: (source: Source) => void;
  // memasukkan teks pertanyaan ke kotak input supaya bisa diubah lalu dikirim ulang
  onEdit: (text: string) => void;
  editDisabled: boolean;
};

export function MessageBubble({ message, onOpenSource, onEdit, editDisabled }: Props) {
  if (message.role === "user") {
    return (
      <div className="group flex flex-col items-end">
        <div className="max-w-[85%] rounded-xl rounded-br-sm border-[2.5px] border-ink bg-violet px-4 py-2.5 text-[15px] font-medium whitespace-pre-wrap text-ink shadow-[3px_3px_0_0_#000]">
          {message.content}
        </div>
        {/* di layar sentuh tidak ada hover, jadi tombol selalu terlihat; di desktop muncul saat hover atau fokus */}
        <div className="mt-1 flex gap-0.5 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          <EditButton onClick={() => onEdit(message.content)} disabled={editDisabled} />
          <CopyButton text={message.content} label="Salin pertanyaan" />
        </div>
      </div>
    );
  }

  const sources = message.sources ?? [];
  const listed = citedSources(message.content, sources);

  return (
    <article className="space-y-4">
      {/* Markdown di-style manual karena belum pakai plugin typography Tailwind */}
      <div className="text-base leading-[1.75] wrap-break-word [&_li]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_p:first-child]:mt-0 [&_strong]:font-bold [&_table]:my-3 [&_table]:w-full [&_table]:font-sans [&_table]:text-sm [&_td]:border-2 [&_td]:border-ink [&_td]:px-2 [&_td]:py-1 [&_th]:border-2 [&_th]:border-ink [&_th]:bg-lime [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_ul]:pl-6">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // tabel lebar digulir di tempatnya, bukan melebarkan seluruh halaman di layar kecil
            table: ({ children }) => (
              <div className="no-scrollbar overflow-x-auto">
                <table>{children}</table>
              </div>
            ),
            a: ({ href, children }) => {
              const source = href?.startsWith(CITE_HREF)
                ? sources.find((s) => s.number === Number(href.slice(CITE_HREF.length)))
                : undefined;
              if (source) {
                return (
                  <button
                    type="button"
                    onClick={() => onOpenSource(source)}
                    title={`${source.document_title}, ${shortSection(source.section)}`}
                    aria-label={`Buka sumber ${source.number}: ${shortSection(source.section)}`}
                    className="mx-0.5 inline-flex -translate-y-0.5 items-center rounded-md border-2 border-ink bg-lime px-1.5 text-xs leading-4 font-extrabold text-ink transition-transform hover:-translate-y-1"
                  >
                    {source.number}
                  </button>
                );
              }
              return (
                <a href={href} target="_blank" rel="noreferrer" className="text-ledger underline">
                  {children}
                </a>
              );
            },
          }}
        >
          {linkCitations(message.content)}
        </ReactMarkdown>
      </div>

      <div className="-my-2 flex items-center gap-2">
        <CopyButton text={message.content} label="Salin jawaban" />
        {message.model && <p className="text-xs text-muted">Dijawab oleh {modelLabel(message.model)}</p>}
      </div>

      {listed.length > 0 && (
        // tanpa blur: bisa ada banyak pesan, dan blur di tiap pesan membuat scroll berat
        <section className="mt-5 overflow-hidden rounded-xl border-[2.5px] border-ink bg-surface shadow-[4px_4px_0_0_#000]">
          <h3 className="border-b-[2.5px] border-ink bg-lime px-4 py-2 text-xs font-bold">
            Dasar jawaban ({listed.length} sumber)
          </h3>
          <ol className="divide-y divide-rule">
            {listed.map((s) => (
              <li key={s.number}>
                <button
                  type="button"
                  onClick={() => onOpenSource(s)}
                  className="grid w-full grid-cols-[2rem_1fr_auto] items-baseline gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-ledger-soft"
                >
                  <span className="font-bold text-ledger">{s.number}</span>
                  <span className="min-w-0">
                    <span className="font-medium">{shortSection(s.section)}</span>
                    <span className="block truncate text-xs text-muted">{s.document_title}</span>
                  </span>
                  {s.page ? <span className="text-xs text-muted">hal. {s.page}</span> : <span />}
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}
