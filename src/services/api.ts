/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api.ts
import type { Session } from '../types/chat';

const DEFAULT_API_URL = 'http://localhost:8000';

// Типы для API
// export interface Session {
//   title: ReactNode;
//   lastMessage: import("react/jsx-runtime").JSX.Element;
//   id: string;
//   name?: string;
//   agent_id: string;
//   created_at?: string;
//   updated_at?: string;
// }

export interface ApiMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}

export interface Feedback {
  rating: 'positive' | 'negative' | null;
  comment?: string;
  created_at?: string;
}

export interface ChatResponse {
  message_id: string;
  content: string;
  session_id: string;
  created_at?: string;
}

class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-User-Id': '11111111-1111-1111-1111-111111111111'
    };

    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.message ?? errorBody?.error ?? errorMessage;
      } catch {
        // Если не удалось распарсить JSON, используем стандартное сообщение
      }
      throw new Error(errorMessage);
    }

    // Для DELETE запросов, которые не возвращают тело
    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  // === Управление сессиями ===

  /**
   * Создать новую сессию для агента
   */
  async createSession(agentId: string): Promise<Session> {
    const response = await fetch(`${this.baseUrl}/agents/${agentId}/sessions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ agentId })

    });
    return this.handleResponse<Session>(response);
  }

  /**
   * Получить список всех сессий агента
   */
  async listSessions(agentId: string): Promise<Session[]> {
    const response = await fetch(`${this.baseUrl}/agents/${agentId}/sessions`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    return this.handleResponse<Session[]>(response);
  }

  /**
   * Получить сообщения сессии
   */
  async getSessionMessages(agentId: string, sessionId: string): Promise<ApiMessage[]> {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/sessions/${sessionId}/messages`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    return this.handleResponse<ApiMessage[]>(response);
  }

  /**
   * Переименовать сессию
   */
  async renameSession(agentId: string, sessionId: string, name: string): Promise<Session> {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/sessions/${sessionId}`,
      {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ name }),
      }
    );
    return this.handleResponse<Session>(response);
  }

  /**
   * Удалить сессию
   */
  async deleteSession(agentId: string, sessionId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/sessions/${sessionId}`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );
    await this.handleResponse<void>(response);
  }

  // === Обратная связь ===

  /**
   * Установить обратную связь для сообщения
   */
  async setFeedback(
    agentId: string,
    messageId: string,
    // vote: 'positive' | 'negative',
    vote: number,
    comment?: string
  ): Promise<Feedback> {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/messages/${messageId}/feedback`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ vote, comment }),
      }
    );
    return this.handleResponse<Feedback>(response);
  }

  /**
   * Получить обратную связь для сообщения
   */
  async getFeedback(agentId: string, messageId: string): Promise<Feedback> {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/messages/${messageId}/feedback`,
      {
        method: 'GET',
        headers: this.getHeaders(),
      }
    );
    return this.handleResponse<Feedback>(response);
  }

  /**
   * Удалить обратную связь для сообщения
   */
  async deleteFeedback(agentId: string, messageId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/messages/${messageId}/feedback`,
      {
        method: 'DELETE',
        headers: this.getHeaders(),
      }
    );
    await this.handleResponse<void>(response);
  }

  // === Чат ===

  /**
   * Отправить сообщение в сессию агента (без стриминга)
   */
  async chat(
    agentId: string,
    sessionId: string,
    message: string,
    context?: any
  ): Promise<ChatResponse> {

    if (!agentId || !sessionId) {
      if (import.meta.env.DEV) {
        console.log('Не выбрана сессия или агент');
      }
      // set({ error: 'Не выбрана сессия или агент' });
      // return;
    }
    const response = await fetch(
      `${this.baseUrl}/agents/${agentId}/sessions/${sessionId}/chat`,
      {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ message, context }),
      }
    );
    return this.handleResponse<ChatResponse>(response);
  }

  /**
   * Отправить сообщение в сессию агента (со стримингом)
   * Возвращает AsyncGenerator для потокового получения ответа
   */
  // src/services/api.ts

  /**
   * Отправить сообщение в сессию агента (со стримингом)
   * Возвращает AsyncGenerator для потокового получения ответа
   */
  // src/services/api.ts

  /**
   * Отправить сообщение в сессию агента (со стримингом)
   * Возвращает AsyncGenerator для потокового получения ответа
   */
  async *streamChat(
    agentId: string,
    sessionId: string,
    message: string,
    context?: any,
    signal?: AbortSignal
  ): AsyncGenerator<string, void, undefined> {
    const url = `${this.baseUrl}/agents/${agentId}/sessions/${sessionId}/chat`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-User-Id': '11111111-1111-1111-1111-111111111111'
    };

    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // ДОБАВЛЯЕМ agent_id В ТЕЛО ЗАПРОСА КАК В SMARTCHAT
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        context,
        agent_id: agentId, // <-- ДОБАВИЛИ
        session_id: sessionId,
        stream: true
      }),
      signal,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.message ?? errorBody?.error ?? errorMessage;
      } catch {
        // Если не удалось распарсить JSON
      }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream not supported in this environment');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          if (trimmedLine === '') continue;

          if (trimmedLine.startsWith('data: ')) {
            const jsonStr = trimmedLine.slice(6).trim();

            if (jsonStr === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(jsonStr);

              if (parsed.error) {
                // НЕ ВЫБРАСЫВАЕМ ОШИБКУ, А ВОЗВРАЩАЕМ КАК ТЕКСТ
                yield `⚠️ ${parsed.error}`;
                continue;
              }

              if (parsed.chunks && Array.isArray(parsed.chunks)) {
                for (const chunk of parsed.chunks) {
                  if (chunk.text) {
                    yield chunk.text;
                  }
                }
              }

              if (parsed.text) {
                yield parsed.text;
              }

              if (parsed.content) {
                yield parsed.content;
              }
            } catch (e) {
              if (e instanceof Error && e.message.includes('Unexpected token')) {
                continue;
              }
              throw e;
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      throw error;
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // Игнорируем
      }
    }
  }

  // === Smart Chat ===

  /**
   * Умный чат без привязки к конкретному агенту
   */
  async smartChat(message: string, agent_id: string, context?: any): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ message, agent_id, context }),
    });
    return this.handleResponse<ChatResponse>(response);
  }

  /**
   * Умный чат со стримингом
   */
  async *smartChatStream(
    message: string,
    agent_id: string,
    session_id: string | null,
    context?: any,
    signal?: AbortSignal
  ): AsyncGenerator<{ token?: string; citations?: string[]; message_id?: number; done?: boolean }, void, undefined> {
    const url = `${this.baseUrl}/chat`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-User-Id': '11111111-1111-1111-1111-111111111111'
    };

    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: session_id != null
        ? JSON.stringify({ message, agent_id, session_id, context, stream: true })
        : JSON.stringify({ message, agent_id, context, stream: true }),
      signal,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage = errorBody?.message ?? errorBody?.error ?? errorMessage;
      } catch {
        // Если не удалось распарсить JSON
      }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('ReadableStream not supported in this environment');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    // let citations: string[] = [];
    // let messageId: number | undefined;

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;

          // Обработка SSE формата
          if (trimmedLine.startsWith('data: ')) {
            const jsonStr = trimmedLine.slice(6).trim();

            // Проверяем на завершение
            if (jsonStr === '[DONE]') {
              yield { done: true };
              return;
            }

            try {
              const parsed = JSON.parse(jsonStr);

              // Проверяем на ошибку
              if (parsed.error) {
                throw new Error(parsed.error);
              }

              // 1. Обработка chunks (содержат текст и источники)
              // if (parsed.chunks && Array.isArray(parsed.chunks)) {
              //   const newCitations: string[] = [];
              //   let fullText = '';

              //   for (const chunk of parsed.chunks) {
              //     // Сохраняем текст
              //     if (chunk.text) {
              //       fullText += chunk.text;
              //     }

              //     // Сохраняем источник (цитату)
              //     if (chunk.source) {
              //       newCitations.push(chunk.source);
              //     }
              //   }

              //   // Обновляем общий список цитат
              //   if (newCitations.length > 0) {
              //     citations = [...new Set([...citations, ...newCitations])];
              //   }

              //   // Отдаем текст из чанков (если есть)
              //   if (fullText) {
              //     yield {
              //       token: fullText,
              //       citations: citations.length > 0 ? citations : undefined
              //     };
              //   }
              // }

              // 2. Обработка отдельных токенов (на уровне корня объекта)
              if (parsed.token !== undefined && parsed.token !== null) {
                yield {
                  token: parsed.token,
                  // citations: citations.length > 0 ? citations : undefined
                };
              }

              // 3. Обработка message_id (финальный ID сообщения)
              if (parsed.message_id !== undefined) {
                yield {
                  message_id: parsed.message_id,
                  // citations: citations.length > 0 ? citations : undefined
                };
              }

              // Отладочный вывод
              if (import.meta.env.DEV) {
                console.log('SSE Message:', parsed);
              }

            } catch (e) {
              // Если ошибка парсинга JSON, игнорируем
              if (e instanceof Error && e.message.includes('Unexpected token')) {
                continue;
              }
              throw e;
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      throw error;
    } finally {
      try {
        reader.releaseLock();
      } catch {
        // Игнорируем
      }
    }
  }






  // === Загрузка файлов ===

  /**
   * Загрузить файл на сервер
   */
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ fileId: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText) as {
              fileId: string;
              url: string;
            };
            resolve(response);
          } catch {
            reject(new Error('Invalid response format'));
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new DOMException('Upload aborted', 'AbortError'));
      });

      const token = typeof localStorage !== 'undefined'
        ? localStorage.getItem('auth_token')
        : null;

      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.open('POST', `${this.baseUrl}/upload`);
      xhr.send(formData);
    });
  }
}

// Создаем экземпляр клиента
export const apiClient = new ApiClient();

// Экспортируем отдельные функции для удобства
export const {
  createSession,
  listSessions,
  getSessionMessages,
  renameSession,
  deleteSession,
  setFeedback,
  getFeedback,
  deleteFeedback,
  chat,
  streamChat,
  smartChat,
  smartChatStream,
  uploadFile,
} = apiClient;