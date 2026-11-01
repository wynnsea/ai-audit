import type { Metadata } from "next";
import { DocumentsView } from "@/components/documents/documents-view";

export const metadata: Metadata = {
  title: "Dokumen | AI Audit Assistant",
};

export default function DocumentsPage() {
  return <DocumentsView />;
}
