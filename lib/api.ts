import type {
  AskResponse,
  AuditDocument,
  ChatMessage,
  ChatSession,
} from "./types";

// semua request lewat /api (rewrite di next.config.ts → Go service)
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init);
  // 204 (misal setelah hapus) tidak punya body, jadi hasil parse-nya null
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    // Go selalu mengirim error dalam bentuk {"error": "..."}
    throw new Error(body?.error ?? `Request gagal (${res.status})`);
  }
  return body as T;
}

export function errorMessage(e: unknown, fallback: string) {
  return e instanceof Error ? e.message : fallback;
}

export const api = {
  listDocuments: () => request<AuditDocument[]>("/documents"),

  uploadDocument: (form: FormData) =>
    request<AuditDocument>("/documents", { method: "POST", body: form }),

  listSessions: () => request<ChatSession[]>("/chat/sessions"),

  renameSession: (sessionId: string, title: string) =>
    request<{ id: string; title: string }>(`/chat/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    }),

  deleteSession: (sessionId: string) =>
    request<null>(`/chat/sessions/${sessionId}`, { method: "DELETE" }),

  listMessages: (sessionId: string) =>
    request<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`),

  // urutan pertama = model default
  listModels: () => request<string[]>("/chat/models"),

  ask: (question: string, sessionId?: string, model?: string, documentIds?: string[]) =>
    request<AskResponse>("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, session_id: sessionId, model, document_ids: documentIds }),
    }),
};
