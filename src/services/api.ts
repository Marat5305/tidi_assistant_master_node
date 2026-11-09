/* eslint-disable @typescript-eslint/no-explicit-any */
import { AGENTS } from '../config/agents';
import type {
  Conversation,
  ApiMessage,
  ChatResponse,
  ModelsConversationsEntry,
  Citation
} from '../types/chat';

const api_url_response = await fetch('/config.json');
const json = await api_url_response.json();
const DEFAULT_API_URL: string = json.API_BASE_URL;

export interface Feedback {
  rating: 'positive' | 'negative' | null;
  comment?: string;
  created_at?: string;
}

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? (import.meta as any).env?.VITE_API_URL ?? DEFAULT_API_URL;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-Id': '11111111-1111-1111-1111-111111111111',
    };
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private getHeadersRAGDocumentsUpload(): HeadersInit {
    const headers: Record<string, string> = {
      'X-User-Id': '11111111-1111-1111-1111-111111111111',
    };
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
    payload?: { name?: string; model?: string },
  ): Promise<Conversation> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/platform/conversations`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload ?? {}),
    });
    return this.handleResponse<Conversation>(res);
  }

  async listConversations(agent_id: string): Promise<Conversation[]> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/platform/conversations`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return this.handleResponse<Conversation[]>(res);
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
    return this.handleResponse<ApiMessage[]>(res);
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
    return this.handleResponse<Conversation>(res);
  }

  async deleteConversation(
    agent_id: string,
    conversation_id: string,
  ): Promise<void> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/platform/conversations/${conversation_id}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    await this.handleResponse<void>(res);
  }

  // === Feedback ===

  async setFeedback(model: string, messageId: string, vote: number, comment?: string): Promise<Feedback> {
    // const response = await fetch(`${this.baseUrl}/models/${model}/messages/${messageId}/feedback`, {
    const response = await fetch(`${this.baseUrl}/agents/${model}/v1/chat/completions/${messageId}/feedback`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ vote, comment }),
    });
    return this.handleResponse<Feedback>(response);
  }

  async getFeedback(model: string, messageId: string): Promise<Feedback> {
    const response = await fetch(`${this.baseUrl}/models/${model}/messages/${messageId}/feedback`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Feedback>(response);
  }

  async deleteFeedback(model: string, messageId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/models/${model}/messages/${messageId}/feedback`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    await this.handleResponse<void>(response);
  }

  // === Чат ===

  async chat(
    model: string,
    conversationId: string,
    message: string,
    context?: any,
  ): Promise<ChatResponse> {
    const response = await fetch(
      `${this.baseUrl}/models/${model}/conversations/${conversationId}/chat`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ message, context }),
      },
    );
    return this.handleResponse<ChatResponse>(response);
  }

  async *streamChat(
    model: string,
    conversationId: string,
    message: string,
    context?: any,
    signal?: AbortSignal,
  ): AsyncGenerator<string, void, undefined> {
    const url = `${this.baseUrl}/models/${model}/conversations/${conversationId}/chat`;
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        message,
        context,
        model,
        conversation_id: conversationId,
        stream: true,
      }),
      signal,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const body = await response.json();
        errorMessage = body?.message ?? body?.error ?? errorMessage;
      } catch { /* ignore */ }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const jsonStr = trimmed.slice(6).trim();
          if (jsonStr === '[DONE]') return;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.error) {
              yield `⚠️ ${parsed.error}`;
              continue;
            }
            if (parsed.chunks && Array.isArray(parsed.chunks)) {
              for (const c of parsed.chunks) if (c.text) yield c.text;
            }
            if (parsed.text) yield parsed.text;
            if (parsed.content) yield parsed.content;

            // OpenAI-совместимый fallback
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === 'string' && delta.length > 0) yield delta;
          } catch (e) {
            if (e instanceof Error && e.message.includes('Unexpected token')) continue;
            throw e;
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      throw error;
    } finally {
      try { reader.releaseLock(); } catch { /* ignore */ }
    }
  }

  // === Smart Chat ===

  async *smartChatStream(
    message: string,
    model?: string,
    conversation_id?: string | null,
    context?: any,
    signal?: AbortSignal,
  ): AsyncGenerator<
    {
      token?: string;
      model?: string;
      conversation_id?: string;
      completion_id?: string;   // <-- добавили
      done?: boolean;
    },
    void,
    undefined
  > {
    const url = `${this.baseUrl}/v1/chat/completions`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-User-Id': '11111111-1111-1111-1111-111111111111',
    };

    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const body: any = {
      model: model || 'auto',
      stream: true,
      messages: [{ role: 'user', content: message }],
    };
    if (conversation_id) body.conversation_id = conversation_id;
    if (context) body.context = context;

    console.log('📤 [api.smartChatStream] Отправка:', { url, body, hasSignal: !!signal });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const b = await response.json();
        errorMessage =
          b?.error?.message ?? b?.message ?? b?.error ?? errorMessage;
      } catch { /* ignore */ }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('ReadableStream not supported');

    const decoder = new TextDecoder();
    let buffer = '';
    let chunkCount = 0;
    let lastCompletionId: string | undefined;   // <-- чтобы не спамить одним и тем же id

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          for (const rawLine of evt.split('\n')) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;

            const jsonStr = line.slice(5).trim();
            if (!jsonStr) continue;

            if (jsonStr === '[DONE]') {
              yield { done: true };
              return;
            }

            let parsed: any;
            try {
              parsed = JSON.parse(jsonStr);
            } catch {
              console.warn('⚠️ Пропуск невалидного JSON:', jsonStr.slice(0, 100));
              continue;
            }

            chunkCount++;
            if (chunkCount <= 3) console.log(`📦 Чанк #${chunkCount}:`, parsed);

            if (parsed.error) {
              throw new Error(
                parsed.error?.message ?? parsed.error ?? 'Stream error',
              );
            }

            // === completion_id ===
            // В OpenAI-совместимом ответе поле называется `id`.
            // Отдаём один раз (когда встретили впервые) либо при смене.
            const cid: string | undefined = parsed.id;
            if (cid && cid !== lastCompletionId) {
              lastCompletionId = cid;
              yield { completion_id: cid, token: '' };
            }

            // === Метаданные: model / conversation_id ===
            if (parsed.model || parsed.conversation_id) {
              yield {
                model: parsed.model,
                conversation_id: parsed.conversation_id,
                token: '',
              };
            }

            // === Токен ===
            const delta =
              parsed?.choices?.[0]?.delta?.content ??
              parsed?.choices?.[0]?.message?.content;

            if (typeof delta === 'string' && delta.length > 0) {
              yield { token: delta };
              continue;
            }

            if (parsed.token != null) { yield { token: parsed.token }; continue; }
            if (parsed.content != null) { yield { token: parsed.content }; continue; }

            // === Финал ===
            const finishReason = parsed?.choices?.[0]?.finish_reason;
            if (finishReason) {
              yield { done: true };
              return;
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      throw error;
    } finally {
      try { reader.releaseLock(); } catch { /* ignore */ }
    }
  }

  // === Completion API (по completion_id) ===

  /**
   * Получить полный ответ по completion_id.
   * Полезно, если стрим прервался — можно дозагрузить текст.
   */
  async getCompletion(
    agent_id: string,
    completion_id: string,
  ): Promise<any> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/chat/completions/${completion_id}`;
    const res = await fetch(url, { headers: this.getHeaders() });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const b = await res.json();
        msg = b?.error?.message ?? b?.message ?? b?.error ?? msg;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }

    return res.json();
  }

  /**
   * Получить источники RAG для конкретного ответа.
   */
  async getCompletionSources(
    agent_id: string,
    completion_id: string,
  ): Promise<Citation[]> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/chat/completions/${completion_id}/sources`;
    const res = await fetch(url, { headers: this.getHeaders() });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const b = await res.json();
        msg = b?.error?.message ?? b?.message ?? b?.error ?? msg;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }

    const data = await res.json();

    // Бэкенд может вернуть массив или объект с полем sources/citations/references
    const raw: any[] = Array.isArray(data)
      ? data
      : data?.sources ?? data?.citations ?? data?.references ?? [];

    return raw.map((s: any, i: number) => ({
      id: String(s.id ?? s.doc_id ?? s.source_id ?? `src-${i + 1}`),
      number: Number(s.number ?? i + 1),
      title:
        s.title ?? s.source ?? s.file_name ?? s.document_name ?? undefined,
      snippet: s.snippet ?? s.text ?? s.chunk ?? undefined,
      url: s.url ?? s.link ?? undefined,
    }));
  }

  /**
   * Альтернативное представление ответа по completion_id.
   */
  async getResponseByCompletion(
    agent_id: string,
    completion_id: string,
  ): Promise<any> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/responses/${completion_id}`;
    const res = await fetch(url, { headers: this.getHeaders() });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const b = await res.json();
        msg = b?.error?.message ?? b?.message ?? b?.error ?? msg;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }

    return res.json();
  }

  // === Feedback по completion_id ===

  async setCompletionFeedback(
    agent_id: string,
    completion_id: string,
    vote: number,
    comment?: string,
  ): Promise<Feedback> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/chat/completions/${completion_id}/feedback`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ vote, comment }),
    });
    return this.handleResponse<Feedback>(res);
  }

  async getCompletionFeedback(
    agent_id: string,
    completion_id: string,
  ): Promise<Feedback> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/chat/completions/${completion_id}/feedback`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return this.handleResponse<Feedback>(res);
  }

  async deleteCompletionFeedback(
    agent_id: string,
    completion_id: string,
  ): Promise<void> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/chat/completions/${completion_id}/feedback`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    await this.handleResponse<void>(res);
  }

  // === Platform conversations ===

  /**
   * Создать беседу в платформенном API.
   */
  async createPlatformConversation(
    agent_id: string,
    payload?: { name?: string; model?: string },
  ): Promise<Conversation> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/platform/conversations`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload ?? {}),
    });
    return this.handleResponse<Conversation>(res);
  }

  /**
   * Список бесед агента.
   */
  async listPlatformConversations(
    agent_id: string,
  ): Promise<Conversation[]> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/platform/conversations`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return this.handleResponse<Conversation[]>(res);
  }

  /**
   * Сообщения беседы.
   */
  async getPlatformConversationMessages(
    agent_id: string,
    conversation_id: string,
  ): Promise<ApiMessage[]> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/platform/conversations/${conversation_id}/messages`;
    const res = await fetch(url, { headers: this.getHeaders() });
    return this.handleResponse<ApiMessage[]>(res);
  }

  /**
   * Переименовать беседу.
   */
  async renamePlatformConversation(
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
    return this.handleResponse<Conversation>(res);
  }

  /**
   * Удалить беседу.
   */
  async deletePlatformConversation(
    agent_id: string,
    conversation_id: string,
  ): Promise<void> {
    const url = `${this.baseUrl}/agents/${agent_id}/v1/platform/conversations/${conversation_id}`;
    const res = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    await this.handleResponse<void>(res);
  }

  // === Файлы ===

  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<{ fileId: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      });
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });
      xhr.addEventListener('error', () => reject(new Error('Network error')));
      xhr.addEventListener('abort', () =>
        reject(new DOMException('Upload aborted', 'AbortError')),
      );

      const token =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem('auth_token')
          : null;
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.open('POST', `${this.baseUrl}/upload`);
      xhr.send(formData);
    });
  }

  // agents/${agent_id}/v1/platform/conversations/${conversation_id}
  // Создать RAG
  async createRAGSet(payload: {
  name: string;
  description?: string | null;
  top_k?: number;
  score_threshold?: number;
  prompt?: string | null;
  temperature?: number;
}): Promise<{ id: string }> {
  const res = await fetch(`${this.baseUrl}/agents/rag_ingestion/v1/platform/rags`, {
    method: 'POST',
    // headers: { 'Content-Type': 'application/json' },
    headers: this.getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

async uploadRAGDocuments(
  ragId: string,
  files: File[],
): Promise<{ documents: Array<{ id: string; filename: string; status: string; duplicate_of: string | null }> }> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const res = await fetch(
    `${this.baseUrl}/agents/rag_ingestion/v1/platform/rags/${ragId}/documents`,
    {
      headers: this.getHeadersRAGDocumentsUpload(),
      method: 'POST',
      body: formData,
      // Content-Type НЕ ставим — браузер сам выставит multipart boundary
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}



  /**
 * OCR: распознать файл (изображение/PDF) напрямую, без диалога.
 * POST /agents/ocr/ocr
 * multipart/form-data, поле "file"
 * Ответ — SSE-стрим: data: {"token": "..."} ... data: [DONE]
 */
  async ocrFile(
    file: File,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
  ): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    onProgress?.(0);

    const response = await fetch(`${this.baseUrl}/agents/ocr/ocr`, {
      method: 'POST',
      headers: {
        'X-User-Id': '11111111-1111-1111-1111-111111111111',
        ...(typeof localStorage !== 'undefined' &&
          localStorage.getItem('auth_token')
          ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
          : {}),
        // ВАЖНО: Content-Type НЕ ставим — браузер сам выставит
        // multipart/form-data; boundary=... для FormData
      },
      body: formData,
      signal,
    });

    if (!response.ok) {
      let errorMessage = `Ошибка ${response.status}`;
      try {
        const e = await response.json();
        errorMessage = e.detail || e.message || e.error || errorMessage;
      } catch {
        /* ignore */
      }
      throw new Error(errorMessage);
    }

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

        // SSE-события разделены \n\n; но ваш пример — построчный "data: ..."
        // Обработаем оба варианта: сначала разбиваем по \n
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // последняя строка может быть неполной

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line.startsWith('data:')) continue;

          const jsonStr = line.slice(5).trim(); // поддерживаем и "data: x", и "data:x"
          if (!jsonStr) continue;

          if (jsonStr === '[DONE]') {
            onProgress?.(100);
            return fullText || '';
          }

          try {
            const parsed = JSON.parse(jsonStr);
            if (typeof parsed.token === 'string' && parsed.token.length > 0) {
              fullText += parsed.token;
              // прогресс "обработки" — по количеству полученных токенов
              // (не процентах, а как индикатор активности)
              onProgress?.(Math.min(99, Math.round(fullText.length / 10)));
            }
          } catch {
            /* некорректный JSON — пропускаем */
          }
        }
      }
    } catch (error) {
      // При отмене возвращаем то, что успели распознать — это полезный результат
      if (error instanceof Error && error.name === 'AbortError') {
        return fullText || '';
      }
      throw error;
    } finally {
      try {
        reader.releaseLock();
      } catch {
        /* ignore */
      }
    }

    onProgress?.(100);
    return fullText || '';
  }
}

export const apiClient = new ApiClient();

export const {
  createConversation,
  listConversations,
  allModelsConversations,
  getConversationMessages,
  renameConversation,
  deleteConversation,
  setFeedback,
  getFeedback,
  deleteFeedback,
  chat,
  streamChat,
  smartChatStream,
  uploadFile,
  ocrFile,
  getCompletion,
  getCompletionSources,
  getResponseByCompletion,
  setCompletionFeedback,
  getCompletionFeedback,
  deleteCompletionFeedback,
  createPlatformConversation,
  listPlatformConversations,
  getPlatformConversationMessages,
  renamePlatformConversation,
  deletePlatformConversation,
  createRAGSet,
  uploadRAGDocuments
} = apiClient;