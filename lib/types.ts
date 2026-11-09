// Bentuk data mengikuti JSON dari Go service (internal/entity)

export type DocumentStatus = "processing" | "ready" | "failed";

// bukan "Document" supaya tidak bentrok dengan tipe Document bawaan DOM
export interface AuditDocument {
  id: string;
  title: string;
  file_name: string;
  regulation_type?: string;
  // model yang membaca halaman scan/gambar; kosong = tidak memakai OCR
  ocr_model?: string;
  status: DocumentStatus;
  error_message?: string;
  created_at: string;
}

export interface Source {
  number: number;
  chunk_id: string;
  document_id: string;
  document_title: string;
  section: string;
  page?: number;
  content: string;
  score: number;
}

export interface ChatSession {
  id: string;
  title: string;
  // kosong = semua dokumen
  document_ids?: string[];
  created_at: string;
  // waktu pesan terakhir; riwayat diurutkan dari sini
  last_message_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  model?: string;
  created_at: string;
}

export interface AskResponse {
  session_id: string;
  search_query: string;
  answer: string;
  sources: Source[];
  model?: string;
}
