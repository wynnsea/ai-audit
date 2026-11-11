import type { Metadata } from "next";
import { DocumentsView } from "@/components/documents/documents-view";

export const metadata: Metadata = {
  title: "Dokumen | List MBG",
};

export default function DocumentsPage() {
  return <DocumentsView />;
}
