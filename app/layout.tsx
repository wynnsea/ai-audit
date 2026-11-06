import type { Metadata } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

// Public Sans untuk UI, Source Serif untuk jawaban & kutipan supaya terbaca seperti naskah regulasi
const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Audit Assistant",
  description: "Tanya jawab dokumen regulasi dan standar dengan sitasi pasal",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${publicSans.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      {/* h-dvh: mengikuti tinggi layar HP saat address bar muncul atau hilang */}
      <body className="flex h-dvh flex-col bg-paper font-sans text-ink">
        <Nav />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
