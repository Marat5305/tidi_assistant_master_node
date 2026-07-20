// /* eslint-disable @typescript-eslint/no-explicit-any */
// // src/services/api.ts
// import type { Session } from '../types/chat';

// // const DEFAULT_API_URL = 'http://89.109.54.73:8005/api';
// const api_url_response = await fetch('/config.json');
// const json = await api_url_response.json();
// // const DEFAULT_API_URL = await api_url_response.json();
// const DEFAULT_API_URL = json.API_BASE_URL;

// // const DEFAULT_API_URL = import.meta.env.VITE_API_URL;

// // Типы для API
// // export interface Session {
// //   title: ReactNode;
// //   lastMessage: import("react/jsx-runtime").JSX.Element;
// //   id: string;
// //   name?: string;
// //   agent_id: string;
// //   created_at?: string;
// //   updated_at?: string;
// // }

// export interface ApiMessage {
//   id: string;
//   session_id: string;
//   role: 'user' | 'assistant' | 'system';
//   content: string;
//   created_at?: string;
// }

// export interface Feedback {
//   rating: 'positive' | 'negative' | null;
//   comment?: string;
//   created_at?: string;
// }

// export interface ChatResponse {
//   message_id: string;
//   content: string;
//   session_id: string;
//   created_at?: string;
// }

// class ApiClient {
//   private readonly baseUrl: string;

//   constructor(baseUrl?: string) {
//     this.baseUrl = baseUrl ?? import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;
//   }

//   private getHeaders(): HeadersInit {
//     const headers: HeadersInit = {
//       'Content-Type': 'application/json',
//       'X-User-Id': '11111111-1111-1111-1111-111111111111'
//     };

//     if (typeof localStorage !== 'undefined') {
//       const token = localStorage.getItem('auth_token');
//       if (token) {
//         headers['Authorization'] = `Bearer ${token}`;
//       }
//     }

//     return headers;
//   }

//   private async handleResponse<T>(response: Response): Promise<T> {
//     if (!response.ok) {
//       let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
//       try {
//         const errorBody = await response.json();
//         errorMessage = errorBody?.message ?? errorBody?.error ?? errorMessage;
//       } catch {
//         // Если не удалось распарсить JSON, используем стандартное сообщение
//       }
//       throw new Error(errorMessage);
//     }

//     // Для DELETE запросов, которые не возвращают тело
//     if (response.status === 204) {
//       return {} as T;
//     }

//     return response.json() as Promise<T>;
//   }

//   // === Управление сессиями ===

//   /**
//    * Создать новую сессию для агента
//    */
//   async createSession(agentId: string): Promise<Session> {
//     const response = await fetch(`${this.baseUrl}/agents/${agentId}/sessions`, {
//       method: 'POST',
//       headers: this.getHeaders(),
//       body: JSON.stringify({ agentId })

//     });
//     return this.handleResponse<Session>(response);
//   }

//   /**
//    * Получить список всех сессий агента
//    */
//   async listSessions(agentId: string): Promise<Session[]> {
//     const response = await fetch(`${this.baseUrl}/agents/${agentId}/sessions`, {
//       method: 'GET',
//       headers: this.getHeaders(),
//     });
//     return this.handleResponse<Session[]>(response);
//   }

//   /**
//    * Получить сообщения сессии
//    */
//   async getSessionMessages(agentId: string, sessionId: string): Promise<ApiMessage[]> {
//     const response = await fetch(
//       `${this.baseUrl}/agents/${agentId}/sessions/${sessionId}/messages`,
//       {
//         method: 'GET',
//         headers: this.getHeaders(),
//       }
//     );
//     return this.handleResponse<ApiMessage[]>(response);
//   }

//   /**
//    * Переименовать сессию
//    */
//   async renameSession(agentId: string, sessionId: string, name: string): Promise<Session> {
//     const response = await fetch(
//       `${this.baseUrl}/agents/${agentId}/sessions/${sessionId}`,
//       {
//         method: 'PATCH',
//         headers: this.getHeaders(),
//         body: JSON.stringify({ name }),
//       }
//     );
//     return this.handleResponse<Session>(response);
//   }

//   /**
//    * Удалить сессию
//    */
//   async deleteSession(agentId: string, sessionId: string): Promise<void> {
//     const response = await fetch(
//       `${this.baseUrl}/agents/${agentId}/sessions/${sessionId}`,
//       {
//         method: 'DELETE',
//         headers: this.getHeaders(),
//       }
//     );
//     await this.handleResponse<void>(response);
//   }

//   // === Обратная связь ===

//   /**
//    * Установить обратную связь для сообщения
//    */
//   async setFeedback(
//     agentId: string,
//     messageId: string,
//     // vote: 'positive' | 'negative',
//     vote: number,
//     comment?: string
//   ): Promise<Feedback> {
//     const response = await fetch(
//       `${this.baseUrl}/agents/${agentId}/messages/${messageId}/feedback`,
//       {
//         method: 'POST',
//         headers: this.getHeaders(),
//         body: JSON.stringify({ vote, comment }),
//       }
//     );
//     return this.handleResponse<Feedback>(response);
//   }

//   /**
//    * Получить обратную связь для сообщения
//    */
//   async getFeedback(agentId: string, messageId: string): Promise<Feedback> {
//     const response = await fetch(
//       `${this.baseUrl}/agents/${agentId}/messages/${messageId}/feedback`,
//       {
//         method: 'GET',
//         headers: this.getHeaders(),
//       }
//     );
//     return this.handleResponse<Feedback>(response);
//   }

//   /**
//    * Удалить обратную связь для сообщения
//    */
//   async deleteFeedback(agentId: string, messageId: string): Promise<void> {
//     const response = await fetch(
//       `${this.baseUrl}/agents/${agentId}/messages/${messageId}/feedback`,
//       {
//         method: 'DELETE',
//         headers: this.getHeaders(),
//       }
//     );
//     await this.handleResponse<void>(response);
//   }

//   // === Чат ===

//   /**
//    * Отправить сообщение в сессию агента (без стриминга)
//    */
//   async chat(
//     agentId: string,
//     sessionId: string,
//     message: string,
//     context?: any
//   ): Promise<ChatResponse> {

//     if (!agentId || !sessionId) {
//       if (import.meta.env.DEV) {
//         console.log('Не выбрана сессия или агент');
//       }
//       // set({ error: 'Не выбрана сессия или агент' });
//       // return;
//     }
//     const response = await fetch(
//       `${this.baseUrl}/agents/${agentId}/sessions/${sessionId}/chat`,
//       {
//         method: 'POST',
//         headers: this.getHeaders(),
//         body: JSON.stringify({ message, context }),
//       }
//     );
//     return this.handleResponse<ChatResponse>(response);
//   }

//   /**
//    * Отправить сообщение в сессию агента (со стримингом)
//    * Возвращает AsyncGenerator для потокового получения ответа
//    */
//   // src/services/api.ts

//   /**
//    * Отправить сообщение в сессию агента (со стримингом)
//    * Возвращает AsyncGenerator для потокового получения ответа
//    */
//   // src/services/api.ts

//   /**
//    * Отправить сообщение в сессию агента (со стримингом)
//    * Возвращает AsyncGenerator для потокового получения ответа
//    */
//   async *streamChat(
//     agentId: string,
//     sessionId: string,
//     message: string,
//     context?: any,
//     signal?: AbortSignal
//   ): AsyncGenerator<string, void, undefined> {
//     const url = `${this.baseUrl}/agents/${agentId}/sessions/${sessionId}/chat`;

//     const headers: HeadersInit = {
//       'Content-Type': 'application/json',
//       'X-User-Id': '11111111-1111-1111-1111-111111111111'
//     };

//     if (typeof localStorage !== 'undefined') {
//       const token = localStorage.getItem('auth_token');
//       if (token) {
//         headers['Authorization'] = `Bearer ${token}`;
//       }
//     }

//     // ДОБАВЛЯЕМ agent_id В ТЕЛО ЗАПРОСА КАК В SMARTCHAT
//     const response = await fetch(url, {
//       method: 'POST',
//       headers,
//       body: JSON.stringify({
//         message,
//         context,
//         agent_id: agentId, // <-- ДОБАВИЛИ
//         session_id: sessionId,
//         stream: true
//       }),
//       signal,
//     });

//     if (!response.ok) {
//       let errorMessage = `HTTP ${response.status}`;
//       try {
//         const errorBody = await response.json();
//         errorMessage = errorBody?.message ?? errorBody?.error ?? errorMessage;
//       } catch {
//         // Если не удалось распарсить JSON
//       }
//       throw new Error(errorMessage);
//     }

//     const reader = response.body?.getReader();
//     if (!reader) {
//       throw new Error('ReadableStream not supported in this environment');
//     }

//     const decoder = new TextDecoder();
//     let buffer = '';

//     try {
//       while (true) {
//         const { done, value } = await reader.read();

//         if (done) {
//           break;
//         }

//         buffer += decoder.decode(value, { stream: true });
//         const lines = buffer.split('\n');
//         buffer = lines.pop() || '';

//         for (const line of lines) {
//           const trimmedLine = line.trim();
//           if (!trimmedLine) continue;
//           if (trimmedLine === '') continue;

//           if (trimmedLine.startsWith('data: ')) {
//             const jsonStr = trimmedLine.slice(6).trim();

//             if (jsonStr === '[DONE]') {
//               return;
//             }

//             try {
//               const parsed = JSON.parse(jsonStr);

//               if (parsed.error) {
//                 // НЕ ВЫБРАСЫВАЕМ ОШИБКУ, А ВОЗВРАЩАЕМ КАК ТЕКСТ
//                 yield `⚠️ ${parsed.error}`;
//                 continue;
//               }

//               if (parsed.chunks && Array.isArray(parsed.chunks)) {
//                 for (const chunk of parsed.chunks) {
//                   if (chunk.text) {
//                     yield chunk.text;
//                   }
//                 }
//               }

//               if (parsed.text) {
//                 yield parsed.text;
//               }

//               if (parsed.content) {
//                 yield parsed.content;
//               }
//             } catch (e) {
//               if (e instanceof Error && e.message.includes('Unexpected token')) {
//                 continue;
//               }
//               throw e;
//             }
//           }
//         }
//       }
//     } catch (error) {
//       if (error instanceof Error && error.name === 'AbortError') {
//         return;
//       }
//       throw error;
//     } finally {
//       try {
//         reader.releaseLock();
//       } catch {
//         // Игнорируем
//       }
//     }
//   }

//   // === Smart Chat ===

//   /**
//    * Умный чат без привязки к конкретному агенту
//    */
//   async smartChat(message: string, agent_id: string, context?: any): Promise<ChatResponse> {
//     const response = await fetch(`${this.baseUrl}/chat`, {
//       method: 'POST',
//       headers: this.getHeaders(),
//       body: JSON.stringify({ message, agent_id, context }),
//     });
//     return this.handleResponse<ChatResponse>(response);
//   }

//   /**
//    * Умный чат со стримингом
//    */
//   async *smartChatStream(
//     message: string,
//     agent_id: string,
//     session_id: string | null,
//     context?: any,
//     signal?: AbortSignal
//   ): AsyncGenerator<{ token?: string; citations?: string[]; message_id?: number; done?: boolean }, void, undefined> {
//     const url = `${this.baseUrl}/chat`;

//     const headers: HeadersInit = {
//       'Content-Type': 'application/json',
//       'X-User-Id': '11111111-1111-1111-1111-111111111111'
//     };

//     if (typeof localStorage !== 'undefined') {
//       const token = localStorage.getItem('auth_token');
//       if (token) {
//         headers['Authorization'] = `Bearer ${token}`;
//       }
//     }

//     const response = await fetch(url, {
//       method: 'POST',
//       headers,
//       body: session_id != null
//         ? JSON.stringify({ message, agent_id, session_id, context, stream: true })
//         : JSON.stringify({ message, agent_id, context, stream: true }),
//       signal,
//     });

//     if (!response.ok) {
//       let errorMessage = `HTTP ${response.status}`;
//       try {
//         const errorBody = await response.json();
//         errorMessage = errorBody?.message ?? errorBody?.error ?? errorMessage;
//       } catch {
//         // Если не удалось распарсить JSON
//       }
//       throw new Error(errorMessage);
//     }

//     const reader = response.body?.getReader();
//     if (!reader) {
//       throw new Error('ReadableStream not supported in this environment');
//     }

//     const decoder = new TextDecoder();
//     let buffer = '';
//     // let citations: string[] = [];
//     // let messageId: number | undefined;

//     try {
//       while (true) {
//         const { done, value } = await reader.read();

//         if (done) {
//           break;
//         }

//         buffer += decoder.decode(value, { stream: true });
//         const lines = buffer.split('\n');
//         buffer = lines.pop() || '';

//         for (const line of lines) {
//           const trimmedLine = line.trim();
//           if (!trimmedLine) continue;

//           // Обработка SSE формата
//           if (trimmedLine.startsWith('data: ')) {
//             const jsonStr = trimmedLine.slice(6).trim();

//             // Проверяем на завершение
//             if (jsonStr === '[DONE]') {
//               yield { done: true };
//               return;
//             }

//             try {
//               const parsed = JSON.parse(jsonStr);

//               // Проверяем на ошибку
//               if (parsed.error) {
//                 throw new Error(parsed.error);
//               }

//               // 1. Обработка chunks (содержат текст и источники)
//               // if (parsed.chunks && Array.isArray(parsed.chunks)) {
//               //   const newCitations: string[] = [];
//               //   let fullText = '';

//               //   for (const chunk of parsed.chunks) {
//               //     // Сохраняем текст
//               //     if (chunk.text) {
//               //       fullText += chunk.text;
//               //     }

//               //     // Сохраняем источник (цитату)
//               //     if (chunk.source) {
//               //       newCitations.push(chunk.source);
//               //     }
//               //   }

//               //   // Обновляем общий список цитат
//               //   if (newCitations.length > 0) {
//               //     citations = [...new Set([...citations, ...newCitations])];
//               //   }

//               //   // Отдаем текст из чанков (если есть)
//               //   if (fullText) {
//               //     yield {
//               //       token: fullText,
//               //       citations: citations.length > 0 ? citations : undefined
//               //     };
//               //   }
//               // }

//               // 2. Обработка отдельных токенов (на уровне корня объекта)
//               if (parsed.token !== undefined && parsed.token !== null) {
//                 yield {
//                   token: parsed.token,
//                   // citations: citations.length > 0 ? citations : undefined
//                 };
//               }

//               // 3. Обработка message_id (финальный ID сообщения)
//               if (parsed.message_id !== undefined) {
//                 yield {
//                   message_id: parsed.message_id,
//                   // citations: citations.length > 0 ? citations : undefined
//                 };
//               }

//               // Отладочный вывод
//               if (import.meta.env.DEV) {
//                 console.log('SSE Message:', parsed);
//               }

//             } catch (e) {
//               // Если ошибка парсинга JSON, игнорируем
//               if (e instanceof Error && e.message.includes('Unexpected token')) {
//                 continue;
//               }
//               throw e;
//             }
//           }
//         }
//       }
//     } catch (error) {
//       if (error instanceof Error && error.name === 'AbortError') {
//         return;
//       }
//       throw error;
//     } finally {
//       try {
//         reader.releaseLock();
//       } catch {
//         // Игнорируем
//       }
//     }
//   }






//   // === Загрузка файлов ===

//   /**
//    * Загрузить файл на сервер
//    */
//   async uploadFile(
//     file: File,
//     onProgress?: (progress: number) => void
//   ): Promise<{ fileId: string; url: string }> {
//     const formData = new FormData();
//     formData.append('file', file);

//     return new Promise((resolve, reject) => {
//       const xhr = new XMLHttpRequest();

//       xhr.upload.addEventListener('progress', (event) => {
//         if (event.lengthComputable && onProgress) {
//           const progress = Math.round((event.loaded / event.total) * 100);
//           onProgress(progress);
//         }
//       });

//       xhr.addEventListener('load', () => {
//         if (xhr.status >= 200 && xhr.status < 300) {
//           try {
//             const response = JSON.parse(xhr.responseText) as {
//               fileId: string;
//               url: string;
//             };
//             resolve(response);
//           } catch {
//             reject(new Error('Invalid response format'));
//           }
//         } else {
//           reject(new Error(`Upload failed: ${xhr.status}`));
//         }
//       });

//       xhr.addEventListener('error', () => {
//         reject(new Error('Network error during upload'));
//       });

//       xhr.addEventListener('abort', () => {
//         reject(new DOMException('Upload aborted', 'AbortError'));
//       });

//       const token = typeof localStorage !== 'undefined'
//         ? localStorage.getItem('auth_token')
//         : null;

//       if (token) {
//         xhr.setRequestHeader('Authorization', `Bearer ${token}`);
//       }

//       xhr.open('POST', `${this.baseUrl}/upload`);
//       xhr.send(formData);
//     });
//   }
// }

// // Создаем экземпляр клиента
// export const apiClient = new ApiClient();

// // Экспортируем отдельные функции для удобства
// export const {
//   createSession,
//   listSessions,
//   getSessionMessages,
//   renameSession,
//   deleteSession,
//   setFeedback,
//   getFeedback,
//   deleteFeedback,
//   chat,
//   streamChat,
//   smartChat,
//   smartChatStream,
//   uploadFile,
// } = apiClient;




/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/api.ts
import type { Session } from '../types/chat';

// const DEFAULT_API_URL = 'http://89.109.54.73:8005/api';
const api_url_response = await fetch('/config.json');
const json = await api_url_response.json();
// const DEFAULT_API_URL = await api_url_response.json();
const DEFAULT_API_URL = json.API_BASE_URL;

// const DEFAULT_API_URL = import.meta.env.VITE_API_URL;

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
        method: 'DELETE',headers: this.getHeaders(),
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
     * Поддерживает три сценария:
     * 1. {message} - только сообщение (роутинг)
     * 2. {message, agent_id} - сообщение + агент (ручной выбор)
     * 3. {message, agent_id, session_id} - сообщение + агент + сессия (продолжение)
     */
//     async *smartChatStream(
//       message: string,
//       agent_id?: string,
//       session_id?: string | null,
//       context?: any,
//       signal?: AbortSignal
//     ): AsyncGenerator<{ token?: string; citations?: string[]; message_id?: number; done?: boolean; agentId?: string; sessionId?: string }, void, undefined> {
//       const url = `${this.baseUrl}/chat`;

//       const headers: HeadersInit = {
//         'Content-Type': 'application/json',
//         'X-User-Id': '11111111-1111-1111-1111-111111111111'
//       };

//       if (typeof localStorage !== 'undefined') {
//         const token = localStorage.getItem('auth_token');
//         if (token) {
//           headers['Authorization'] = `Bearer ${token}`;
//         }
//       }

//       const body: any = { 
//         message, 
//         stream: true 
//       };
      
//       if (agent_id) {
//         body.agent_id = agent_id;
//       }
      
//       if (session_id) {
//         body.session_id = session_id;
//       }
      
//       if (context) {
//         body.context = context;
//       }

//       // ========== 🔍 НОВОЕ ЛОГИРОВАНИЕ 1 ==========
//       console.log('📤 [api.smartChatStream] Отправка запроса:', {
//         url,
//         method: 'POST',
//         headers: {
//           'Content-Type': headers['Content-Type'],
//           'X-User-Id': headers['X-User-Id'],
//           'Authorization': headers['Authorization'] ? 'Bearer ***' : undefined
//         },
//         body: body,
//         hasSignal: !!signal
//       });
//       // ===========================================

//       const response = await fetch(url, {
//         method: 'POST',
//         headers,
//         body: JSON.stringify(body),
//         signal,
//       });

//       // ========== 🔍 НОВОЕ ЛОГИРОВАНИЕ 2 ==========
//       console.log('📨 [api.smartChatStream] Получен ответ:', {
//         status: response.status,
//         statusText: response.statusText,
//         ok: response.ok,
//         headers: Object.fromEntries(response.headers.entries())
//       });
//       // ==========================================

//       // После получения ответа
//       console.log('📨 [api.smartChatStream] Получен ответ:', {
//         status: response.status,
//         statusText: response.statusText,
//         ok: response.ok,
//       });

//       // ========== 🔍 ЛОГИРУЕМ ВСЕ ЗАГОЛОВКИ ==========
//       console.log('🔍 [api] ВСЕ заголовки ответа:');
//       response.headers.forEach((value, key) => {
//         console.log(`  ${key}: ${value}`);
//       });
//       // ===============================================

//       // ========== ИЗВЛЕКАЕМ ЗАГОЛОВКИ СРАЗУ ПОСЛЕ FETCH ==========
//       // const newAgentId = response.headers.get('x-agent-id');
//       // const newSessionId = response.headers.get('x-session-id');

//       // Отдаем метаданные ПЕРВЫМ СООБЩЕНИЕМ ДО ЧТЕНИЯ СТРИМА
//       // if (newAgentId || newSessionId) {
//       //   // ========== 🔍 НОВОЕ ЛОГИРОВАНИЕ 4 ==========
//       //   console.log('📣 [api.smartChatStream] Отправляем метаданные в поток:', {
//       //     agentId: newAgentId || undefined,
//       //     sessionId: newSessionId || undefined
//       //   });
//       //   // ===========================================
        
//       //   yield {
//       //     agentId: newAgentId || undefined,
//       //     sessionId: newSessionId || undefined,
//       //     token: ''
//       //   };
//       // }

//       // ========== 🔍 НОВОЕ ЛОГИРОВАНИЕ 5 ==========
//       console.log('📡 [api.smartChatStream] Начинаем чтение стрима...');
//       // ===========================================

//       if (!response.ok) {
//         // ========== 🔍 НОВОЕ ЛОГИРОВАНИЕ 6 ==========
//         console.error('❌ [api.smartChatStream] Ошибка ответа:', {
//           status: response.status,
//           statusText: response.statusText
//         });
//         // ===========================================
        
//         let errorMessage = `HTTP ${response.status}`;
//         try {
//           const errorBody = await response.json();
//           errorMessage = errorBody?.message ?? errorBody?.error ?? errorMessage;
//         } catch {
//           // Если не удалось распарсить JSON
//         }
//         throw new Error(errorMessage);
//       }

//       const reader = response.body?.getReader();
//       if (!reader) {
//         throw new Error('ReadableStream not supported in this environment');
//       }

//       const decoder = new TextDecoder();
//       let buffer = '';
//       let chunkCount = 0;

//       try {
//         while (true) {
//           const { done, value } = await reader.read();

//           if (done) {
//             // ========== 🔍 НОВОЕ ЛОГИРОВАНИЕ 7 ==========
//             console.log('🏁 [api.smartChatStream] Стрим завершен. Всего чанков:', chunkCount);
//             // ===========================================
//             break;
//           }

//           buffer += decoder.decode(value, { stream: true });
//           const lines = buffer.split('\n');
//           buffer = lines.pop() || '';

//           for (const line of lines) {
//             const trimmedLine = line.trim();
//             if (!trimmedLine) continue;

//             if (trimmedLine.startsWith('data: ')) {
//               const jsonStr = trimmedLine.slice(6).trim();

//               if (jsonStr === '[DONE]') {
//                 // ========== 🔍 НОВОЕ ЛОГИРОВАНИЕ 8 ==========
//                 console.log('✅ [api.smartChatStream] Получен [DONE]');
//                 // ===========================================
//                 yield { done: true };
//                 return;
//               }

//               try {
//       const parsed = JSON.parse(jsonStr);
      
//       // ========== 🔍 НОВОЕ ЛОГИРОВАНИЕ 9 ==========
//       chunkCount++;
//       if (chunkCount <=3) {
//         console.log(`📦 [api.smartChatStream] Чанк #${chunkCount}:`, parsed);
//       }
//       // ===========================================

//       if (parsed.error) {
//         throw new Error(parsed.error);
//       }

//       // ========== 🔧 НОВАЯ ОБРАБОТКА МЕТАДАННЫХ ==========
//       // Проверяем, есть ли type: "metadata"
//       if (parsed.type === 'metadata') {
//         console.log('🎯 [api] Получены метаданные из SSE:', {
//           agent_id: parsed.agent_id,
//           session_id: parsed.session_id
//         });
        
//         yield {
//           agentId: parsed.agent_id,
//           sessionId: parsed.session_id,
//           token: ''
//         };
//         continue; // Пропускаем дальнейшую обработку этого чанка
//       }
//       // ===================================================

//       // Обработка токенов
//       if (parsed.token !== undefined && parsed.token !== null) {
//         yield {
//           token: parsed.token,
//         };
//       }

//       // Обработка message_id
//       if (parsed.message_id !== undefined) {
//         yield {
//           message_id: parsed.message_id,
//         };
//       }
//     } catch (e) {
//             if (e instanceof Error && e.message.includes('Unexpected token')) {
//               // ========== 🔍 НОВОЕ ЛОГИРОВАНИЕ 10 ==========
//               console.warn('⚠️ [api.smartChatStream] Ошибка парсинга JSON, пропускаем:', jsonStr);
//               // ===========================================
//               continue;
//             }
//             throw e;
//           }
//         }
//       }
//     }
//   } catch (error) {
//     // ========== 🔍 НОВОЕ ЛОГИРОВАНИЕ 11 ==========
//     console.error('💥 [api.smartChatStream] Ошибка в стриме:', error);
//     // ===========================================
    
//     if (error instanceof Error && error.name === 'AbortError') {
//       return;
//     }
//     throw error;
//   } finally {
//     try {
//       reader.releaseLock();
//     } catch {
//       // Игнорируем
//     }
//   }
// }




/**
 * Умный чат со стримингом
 * Поддерживает три сценария:
 * 1. {message} - только сообщение (роутинг, первый запрос)
 * 2. {message, agent_id} - сообщение + агент (ручной выбор)
 * 3. {message, agent_id, session_id} - сообщение + агент + сессия (продолжение)
 */
async *smartChatStream(
  message: string,
  agent_id?: string,
  session_id?: string | null,
  context?: any,
  signal?: AbortSignal
): AsyncGenerator<{ 
  token?: string; 
  agentId?: string; 
  sessionId?: string; 
  done?: boolean;
}, void, undefined> {
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

  // Формируем тело запроса
  const body: any = { 
    message, 
    stream: true 
  };
  
  // Передаем только если есть значения
  if (agent_id) {
    body.agent_id = agent_id;
  }
  
  if (session_id) {
    body.session_id = session_id;
  }
  
  if (context) {
    body.context = context;
  }

  console.log('📤 [api.smartChatStream] Отправка запроса:', {
    url,
    body: {
      ...body,
      message: body.message.slice(0, 50) + (body.message.length > 50 ? '...' : '')
    },
    hasSignal: !!signal
  });

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  });

  console.log('📨 [api.smartChatStream] Получен ответ:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    // Логируем все заголовки для отладки
    headers: Object.fromEntries(response.headers.entries())
  });

  if (!response.ok) {
    console.error('❌ [api.smartChatStream] Ошибка ответа:', {
      status: response.status,
      statusText: response.statusText
    });
    
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
  let chunkCount = 0;

  console.log('📡 [api.smartChatStream] Начинаем чтение стрима...');

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('🏁 [api.smartChatStream] Стрим завершен. Всего чанков:', chunkCount);
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.startsWith('data: ')) {
          const jsonStr = trimmedLine.slice(6).trim();

          if (jsonStr === '[DONE]') {
            console.log('✅ [api.smartChatStream] Получен [DONE]');
            yield { done: true };
            return;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            chunkCount++;
            
            // Логируем первые 3 чанка для отладки
            if (chunkCount <= 3) {
              console.log(`📦 [api.smartChatStream] Чанк #${chunkCount}:`, parsed);
            }

            if (parsed.error) {
              throw new Error(parsed.error);
            }

            // Обработка метаданных (agent_id и session_id)
            // Бекенд может отправлять их как отдельные поля в JSON
            if (parsed.type === 'metadata' || parsed.agent_id || parsed.session_id) {
              console.log('🎯 [api] Получены метаданные из SSE:', {
                agent_id: parsed.agent_id,
                session_id: parsed.session_id,
                type: parsed.type
              });
              
              yield {
                agentId: parsed.agent_id || parsed.agentId,
                sessionId: parsed.session_id || parsed.sessionId,
                token: ''
              };
              continue;
            }

            // Обработка токенов
            if (parsed.token !== undefined && parsed.token !== null) {
              yield {
                token: parsed.token,
              };
            }

            // Альтернативный формат: content вместо token
            if (parsed.content !== undefined && parsed.content !== null) {
              yield {
                token: parsed.content,
              };
            }

          } catch (e) {
            if (e instanceof Error && e.message.includes('Unexpected token')) {
              console.warn('⚠️ [api.smartChatStream] Ошибка парсинга JSON, пропускаем:', jsonStr.slice(0, 100));
              continue;
            }
            throw e;
          }
        }
      }
    }
  } catch (error) {
    console.error('💥 [api.smartChatStream] Ошибка в стриме:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('🛑 [api.smartChatStream] Стрим прерван пользователем');
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