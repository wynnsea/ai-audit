import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Plus Jakarta Sans: huruf geometris tebal karya Tokotype (Jakarta), dipakai untuk seluruh UI dan jawaban
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "List MBG",
  description: "Chat soal MBG (My Bini Gw), daftar karakter anime favorit, lengkap dengan sumbernya",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full antialiased`}>
      {/* h-dvh: mengikuti tinggi layar HP saat address bar muncul atau hilang.
          overflow-hidden: halaman sendiri tidak pernah digulir; yang digulir area di dalamnya
          (daftar chat, halaman dokumen), supaya laci dan tombol menu tidak ikut terdorong keluar layar */}
      <body className="flex h-dvh flex-col overflow-hidden bg-paper font-sans text-ink">
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
