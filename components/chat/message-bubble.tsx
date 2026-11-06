import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { modelLabel } from "@/lib/format";
import type { ChatMessage, Source } from "@/lib/types";

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
};

export function MessageBubble({ message, onOpenSource }: Props) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-[22px] rounded-br-md bg-ledger px-4 py-2.5 text-[15px] whitespace-pre-wrap text-paper">
          {message.content}
        </div>
      </div>
    );
  }

  const sources = message.sources ?? [];
  const listed = citedSources(message.content, sources);

  return (
    <article className="space-y-4">
      {/* Markdown di-style manual karena belum pakai plugin typography Tailwind */}
      <div className="font-serif text-[17px] leading-[1.7] wrap-break-word [&_li]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_p:first-child]:mt-0 [&_strong]:font-semibold [&_table]:my-3 [&_table]:w-full [&_table]:font-sans [&_table]:text-sm [&_td]:border [&_td]:border-rule [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-rule [&_th]:bg-paper [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc [&_ul]:pl-6">
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
                    className="mx-0.5 inline-flex -translate-y-1 items-center rounded-full bg-highlight px-1.5 font-sans text-xs font-bold text-ink transition-opacity hover:opacity-70"
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

      {message.model && (
        <p className="text-xs text-muted">Dijawab oleh {modelLabel(message.model)}</p>
      )}

      {listed.length > 0 && (
        // tanpa blur: bisa ada banyak pesan, dan blur di tiap pesan membuat scroll berat
        <section className="overflow-hidden rounded-[22px] border border-rule bg-surface/60">
          <h3 className="border-b border-rule px-4 py-2 text-xs font-semibold text-muted">
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
