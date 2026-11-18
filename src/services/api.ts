/* eslint-disable @typescript-eslint/no-explicit-any */
import { AGENTS } from '../config/agents';
import type {
  Conversation,
  ApiMessage,
  // ChatResponse,
  ModelsConversationsEntry,
  Citation,
  ConversationMessagesResponse,
  PaginatedMessages,
} from '../types/chat';

const api_url_response = await fetch('/config.json');
const json = await api_url_response.json();
const RAW_API_URL: string = json.API_BASE_URL;
const DEFAULT_API_URL: string = RAW_API_URL.endsWith('/api')
  ? RAW_API_URL
  : `${RAW_API_URL.replace(/\/+$/, '')}/api`;

export interface Feedback {
  vote?: number;
  comment?: string;
  rating?: 'positive' | 'negative' | null;
  created_at?: string;
  updated_at?: string;
  message_id?: string;
}

export interface SmartChatChunk {
  token?: string;
  model?: string;
  conversation_id?: string;
  response_id?: string;
  completion_id?: string;
  citations?: any[];
  done?: boolean;
}

const X_USER_ID = '11111111-1111-1111-1111-111111111111';

export function resolveAgentIdForSources(actualModel: string | null): string | null {
  if (!actualModel) return null;
  if (actualModel.startsWith('rag/')) return 'agentic_rag';
  if (actualModel === 'auto') return null;
  return actualModel;
}

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? (import.meta as any).env?.VITE_API_URL ?? DEFAULT_API_URL;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-Id': X_USER_ID,
    };
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private getHeadersRAGDocumentsUpload(): HeadersInit {
    const headers: Record<string, string> = { 'X-User-Id': X_USER_ID };
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private getAuthOnlyHeaders(): HeadersInit {
    const headers: Record<string, string> = { 'X-User-Id': X_USER_ID };
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.message ?? errorBody?.error ?? errorMessage;
      } catch { /* ignore */ }
      throw new Error(errorMessage);
    }
    if (response.status === 204) return {} as T;
    return response.json() as Promise<T>;
  }

  // === Беседы ===

  async createConversation(
    agent_id: string,
    payload?: { title?: string; name?: string; model?: string; rag_id?: string },
  ): Promise<Conversation> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/platform/conversations`;
    const body: any = {};
    if (payload?.title ?? payload?.name) body.title = payload.title ?? payload.name;
    if (payload?.rag_id) body.rag_id = payload.rag_id;
    if (payload?.model) body.model = payload.model;

    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    const conv = await this.handleResponse<any>(res);
    return { ...conv, name: conv.name ?? conv.title };
  }

  async listConversations(agent_id: string): Promise<Conversation[]> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/platform/conversations`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const list = await this.handleResponse<any[]>(res);
    return (list ?? []).map((c: any) => ({
      ...c,
      name: c.name ?? c.title,
    }));
  }

  async allModelsConversations(): Promise<ModelsConversationsEntry[]> {
    const promises = AGENTS.map(async (agent) => {
      try {
        const conversations = await this.listConversations(agent.id);
        return { model_name: agent.name, model: agent.id, conversations };
      } catch (error) {
        console.warn(`⚠️ Беседы модели ${agent.name}:`, error);
        return { model_name: agent.name, model: agent.id, conversations: [] };
      }
    });
    return Promise.all(promises);
  }

  async getConversationMessages(
    agent_id: string,
    conversation_id: string,
  ): Promise<ApiMessage[]> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/platform/conversations/${conversation_id}/messages`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const raw = await this.handleResponse<ConversationMessagesResponse>(res);

    if (raw && !Array.isArray(raw) && Array.isArray((raw as PaginatedMessages).data)) {
      return (raw as PaginatedMessages).data;
    }
    if (Array.isArray(raw)) return raw;
    return [];
  }

  async renameConversation(
    agent_id: string,
    conversation_id: string,
    name: string,
  ): Promise<Conversation> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/platform/conversations/${conversation_id}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ name }),
    });
    const conv = await this.handleResponse<any>(res);
    return { ...conv, name: conv.name ?? conv.title };
  }

  async deleteConversation(agent_id: string, conversation_id: string): Promise<void> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/platform/conversations/${conversation_id}`;
    const res = await fetch(url, { method: 'DELETE', headers: this.getHeaders() });
    await this.handleResponse<void>(res);
  }

  // === Feedback ===

  async setFeedback(agent_id: string, messageId: string, vote: number, comment?: string): Promise<Feedback> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/chat/completions/${messageId}/feedback`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ vote, ...(comment ? { comment } : {}) }),
    });
    return this.handleResponse<Feedback>(res);
  }

  async getFeedback(agent_id: string, messageId: string): Promise<Feedback> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/chat/completions/${messageId}/feedback`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return this.handleResponse<Feedback>(res);
  }

  async deleteFeedback(agent_id: string, messageId: string): Promise<void> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/chat/completions/${messageId}/feedback`;
    const res = await fetch(url, { method: 'DELETE', headers: this.getHeaders() });
    await this.handleResponse<void>(res);
  }

  // === Responses API (стрим) ===

  async *smartChatStream(
    message: string,
    model?: string,
    conversation_id?: string | null,
    context?: any,
    signal?: AbortSignal,
  ): AsyncGenerator<SmartChatChunk, void, undefined> {
    const url = `${this.baseUrl}/v1/responses`;
    const body: any = { model: model ?? 'auto', stream: true, input: message };
    if (conversation_id) body.conversation_id = conversation_id;
    if (context) body.context = context;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const b = await response.json();
        errorMessage = b?.error?.message ?? b?.message ?? b?.error ?? errorMessage;
      } catch { /* ignore */ }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported');

    const decoder = new TextDecoder();
    let buffer = '';
    let lastResponseId: string | undefined;
    let lastModel: string | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          let eventName = '';
          let dataLine = '';

          for (const rawLine of evt.split('\n')) {
            const line = rawLine.trim();
            if (!line) continue;
            if (line.startsWith(':')) continue;
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLine = line.slice(5).trim();
          }

          if (!dataLine) continue;
          if (dataLine === '[DONE]') { yield { done: true }; return; }

          let parsed: any;
          try { parsed = JSON.parse(dataLine); } catch { continue; }

          if (eventName === 'error' || parsed.type === 'error' || parsed.error) {
            throw new Error(parsed.error?.message ?? parsed.error ?? parsed.message ?? 'Stream error');
          }

          const type: string = parsed.type ?? eventName ?? '';
          const isMetaEvent = type === 'response.created' || type === 'response.in_progress' || type === 'response.completed';

          if (isMetaEvent) {
            const resp = parsed.response ?? parsed;
            if (resp?.id && resp.id !== lastResponseId) {
              lastResponseId = resp.id;
              yield { response_id: resp.id };
            }
            if (resp?.model && resp.model !== lastModel) {
              lastModel = resp.model;
              yield { model: resp.model };
            }
            if (resp?.conversation_id) {
              yield { conversation_id: resp.conversation_id };
            }
          }

          if (type === 'response.output_text.delta') {
            if (typeof parsed.delta === 'string' && parsed.delta.length > 0) {
              yield { token: parsed.delta };
            }
            continue;
          }

          if (type === 'response.content_part.done') {
            const anns = parsed.part?.annotations;
            if (Array.isArray(anns) && anns.length > 0) yield { citations: anns };
            continue;
          }
          if (type === 'response.output_item.done') {
            const anns = (parsed.item?.content ?? []).flatMap((c: any) => c.annotations ?? []);
            if (anns.length > 0) yield { citations: anns };
            continue;
          }

          if (type === 'response.completed') {
            const anns = (parsed.response?.output ?? []).flatMap((o: any) => (o.content ?? []).flatMap((c: any) => c.annotations ?? []));
            if (anns.length > 0) yield { citations: anns };
            yield { done: true };
            return;
          }

          const legacyDelta = parsed?.choices?.[0]?.delta?.content ?? parsed?.choices?.[0]?.message?.content;
          if (typeof legacyDelta === 'string' && legacyDelta.length > 0) { yield { token: legacyDelta }; continue; }
          if (parsed.token != null) { yield { token: parsed.token }; continue; }
          if (parsed.content != null) { yield { token: parsed.content }; continue; }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      throw error;
    } finally {
      try { reader.releaseLock(); } catch { /* ignore */ }
    }
  }

  // === Sources / Completion ===

  async getCompletionSources(agent_id: string, completion_id: string): Promise<Citation[]> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/chat/completions/${completion_id}/sources`;
    const res = await fetch(url, { headers: this.getHeaders() });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const b = await res.json();
        msg = b?.error?.message ?? b?.message ?? b?.error ?? msg;
      } catch { /* ignore */ }
      throw new Error(msg);
    }

    const data = await res.json();
    const raw: any[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

    return raw.map((s: any, i: number) => ({
      id: String(s.chunk_id ?? s.id ?? `src-${i + 1}`),
      number: Number(s.order ?? s.number ?? i + 1),
      title: s.filename ?? s.title ?? s.file_name ?? s.document_name ?? undefined,
      snippet: s.snippet ?? s.text ?? s.chunk ?? undefined,
      url: s.url ?? s.link ?? undefined,
    }));
  }

  // === RAG CRUD ===

  async listRags(): Promise<{ id: string; name: string }[]> {
    const url = `${this.baseUrl}/agents/rag_ingestion/v1/platform/rags`;
    const res = await fetch(url, { headers: this.getHeaders() });
    const data = await this.handleResponse<any>(res);
    return Array.isArray(data) ? data : (data?.data ?? []);
  }

  async createRAGSet(payload: any): Promise<{ id: string }> {
    const res = await fetch(`${this.baseUrl}/agents/rag_ingestion/v1/platform/rags`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    return this.handleResponse<{ id: string }>(res);
  }

  async uploadRAGDocuments(ragId: string, files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    const res = await fetch(`${this.baseUrl}/agents/rag_ingestion/v1/platform/rags/${ragId}/documents`, {
      headers: this.getHeadersRAGDocumentsUpload(),
      method: 'POST',
      body: formData,
    });
    return this.handleResponse<any>(res);
  }

  // === OCR ===

  async ocrFile(file: File, onProgress?: (progress: number) => void, signal?: AbortSignal): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    onProgress?.(0);

    const response = await fetch(`${this.baseUrl}/agents/ocr/ocr`, {
      method: 'POST',
      headers: this.getAuthOnlyHeaders(),
      body: formData,
      signal,
    });

    if (!response.ok) throw new Error(`Ошибка ${response.status}`);
    const reader = response.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported');

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;
          const jsonStr = line.slice(5).trim();
          if (jsonStr === '[DONE]') { onProgress?.(100); return fullText; }
          try {
            const parsed = JSON.parse(jsonStr);
            if (typeof parsed.token === 'string') {
              fullText += parsed.token;
              onProgress?.(Math.min(99, Math.round(fullText.length / 10)));
            }
          } catch {}
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return fullText;
      throw error;
    } finally {
      try { reader.releaseLock(); } catch {}
    }
    onProgress?.(100);
    return fullText;
  }
}

export const apiClient = new ApiClient();