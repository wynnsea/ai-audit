import type {
  AskResponse,
  AuditDocument,
  ChatMessage,
  ChatSession,
} from "./types";

// semua request lewat /api (rewrite di next.config.ts → Go service)
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, init);
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

  listMessages: (sessionId: string) =>
    request<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`),

  ask: (question: string, sessionId?: string) =>
    request<AskResponse>("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, session_id: sessionId }),
    }),
};
