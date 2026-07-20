// /* eslint-disable @typescript-eslint/no-unused-vars */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// // src/store/chatStore.ts
// import { create } from 'zustand';
// import { devtools } from 'zustand/middleware';
// import { apiClient } from '../services/api';
// import type {
//   Message,
//   Citation,
//   ChatState,
//   ChatActions,
//   // Session
// } from '../types/chat';
// import { generateId } from '../utils/id';

// type ChatStore = ChatState & ChatActions;

// // Начальное приветственное сообщение
// const WELCOME_MESSAGE: Message = {
//   id: 'welcome',
//   role: 'assistant',
//   content: 'Привет! Я твой AI-помощник. Задай вопрос или загрузи файл.',
//   threadId: '',
//   sessionId: '',
//   timestamp: Date.now(),
//   created_at: new Date().toISOString(),
//   status: 'sent'
// };

// export const useChatStore = create<ChatStore>()(
//   devtools(
//     (set, get) => ({
//       // === Начальное состояние ===
//       agentId: null,
//       sessions: [],
//       currentSessionId: null,
//       messages: [WELCOME_MESSAGE],
//       isStreaming: false,
//       streamingMessage: '',
//       activeCitations: [],
//       showCitationsPanel: true,
//       error: null,
//       isLoading: false,
//       firstRequest: true,
//       // isMasterMode: true,

//       // === Управление агентом и сессиями ===

//       setAgentId: (agentId: string) => {
//         set({ agentId });
//         get().loadSessions();
//       },

//       toggleFirstRequest: () => {
//         set({ firstRequest: false });
//       },

//       createSession: async () => {
//         const { agentId } = get();
//         if (!agentId) {
//           set({ error: 'Agent ID не установлен' });
//           throw new Error('Agent ID не установлен');
//         }

//         set({ isLoading: true, error: null });

//         try {
//           const session = await apiClient.createSession(agentId);

//           set((state) => ({
//             sessions: [session, ...state.sessions],
//             currentSessionId: session.id,
//             messages: [WELCOME_MESSAGE],
//             isLoading: false,
//           }));

//           return session.id;
//         } catch (error) {
//           const errorMessage = error instanceof Error ? error.message : 'Ошибка создания сессии';
//           set({ error: errorMessage, isLoading: false });
//           throw error;
//         }
//       },

//       loadSessions: async () => {
//         const { agentId } = get();
//         if (!agentId) {
//           set({ error: 'Agent ID не установлен' });
//           return;
//         }

//         set({ isLoading: true, error: null });

//         try {
//           const sessions = await apiClient.listSessions(agentId);

//           set({
//             sessions,
//             isLoading: false,
//           });

//           if (sessions.length > 0 && !get().currentSessionId) {
//             await get().setActiveSession(sessions[0].id);
//           }
//         } catch (error) {
//           const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки сессий';
//           set({ error: errorMessage, isLoading: false });
//         }
//       },

//       setActiveSession: async (sessionId: string) => {
//         const { sessions, agentId } = get();
//         const session = sessions.find((s) => s.id === sessionId);

//         if (!session) {
//           set({ error: 'Сессия не найдена' });
//           return;
//         }

//         set({
//           currentSessionId: sessionId,
//           activeCitations: [],
//           showCitationsPanel: false,
//           error: null,
//         });

//         if (agentId) {
//           await get().loadSessionMessages(sessionId);
//         }
//       },

//       renameSession: async (sessionId: string, name: string) => {
//         const { agentId } = get();
//         if (!agentId) {
//           set({ error: 'Agent ID не установлен' });
//           return;
//         }

//         set({ isLoading: true, error: null });

//         try {
//           const updatedSession = await apiClient.renameSession(agentId, sessionId, name);

//           set((state) => ({
//             sessions: state.sessions.map((s) =>
//               s.id === sessionId ? updatedSession : s
//             ),
//             isLoading: false,
//           }));
//         } catch (error) {
//           const errorMessage = error instanceof Error ? error.message : 'Ошибка переименования сессии';
//           set({ error: errorMessage, isLoading: false });
//         }
//       },

//       deleteSession: async (sessionId: string) => {
//         const { agentId } = get();
//         if (!agentId) {
//           set({ error: 'Agent ID не установлен' });
//           return;
//         }

//         set({ isLoading: true, error: null });

//         try {
//           await apiClient.deleteSession(agentId, sessionId);

//           set((state) => {
//             const filteredSessions = state.sessions.filter((s) => s.id !== sessionId);
//             const isActiveSession = state.currentSessionId === sessionId;

//             return {
//               sessions: filteredSessions,
//               currentSessionId: isActiveSession && filteredSessions.length > 0
//                 ? filteredSessions[0].id
//                 : isActiveSession ? null : state.currentSessionId,
//               messages: isActiveSession ? [WELCOME_MESSAGE] : state.messages,
//               isLoading: false,
//             };
//           });

//           const newState = get();
//           if (newState.currentSessionId && agentId) {
//             await get().loadSessionMessages(newState.currentSessionId);
//           }
//         } catch (error) {
//           const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления сессии';
//           set({ error: errorMessage, isLoading: false });
//         }
//       },

//       // === Работа с сообщениями ===

//       loadSessionMessages: async (sessionId: string) => {
//         const { agentId } = get();
//         if (!agentId) {
//           set({ error: 'Agent ID не установлен' });
//           return;
//         }

//         set({ isLoading: true, error: null });

//         try {
//           const messages = await apiClient.getSessionMessages(agentId, sessionId);

//           const formattedMessages: Message[] = messages.map((msg: any) => ({
//             id: msg.id,
//             role: msg.role,
//             content: msg.content,
//             threadId: msg.session_id,
//             sessionId: msg.session_id,
//             timestamp: Date.now(),
//             created_at: msg.created_at || new Date().toISOString(),
//             status: 'sent' as const
//           }));

//           const finalMessages = formattedMessages.length > 0 ? formattedMessages : [WELCOME_MESSAGE];

//           set({
//             messages: finalMessages,
//             isLoading: false,
//           });
//         } catch (error) {
//           const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки сообщений';
//           set({ error: errorMessage, isLoading: false });
//         }
//       },

//       // === Методы для работы со стримингом ===

//       addMessage: (message: Message) => {
//         set((state) => ({
//           messages: [...state.messages, message],
//           error: null,
//         }));
//       },

//       appendToStreamingMessage: (chunk: string) => {
//         set((state) => ({
//           streamingMessage: state.streamingMessage + chunk,
//         }));
//       },

//       finalizeStreamingMessage: (finalMessage: Message) => {
//         set((state) => {
//           const messagesWithoutStreaming = state.messages.filter(
//             (msg) => msg.id !== 'streaming-temp'
//           );

//           return {
//             messages: [...messagesWithoutStreaming, finalMessage],
//             streamingMessage: '',
//             isStreaming: false,
//           };
//         });
//       },

//       setIsLoading: (isLoading: boolean) => {
//         set({ isLoading });
//       },

//       // === Обычный чат (с агентом) ===

//       sendMessage: async (text: string) => {
//         const { agentId, currentSessionId } = get();

//         if (!agentId || !currentSessionId) {
//           set({ error: 'Не выбрана сессия или агент' });
//           return;
//         }

//         const userMessage: Message = {
//           id: generateId(),
//           role: 'user',
//           content: text,
//           threadId: currentSessionId,
//           sessionId: currentSessionId,
//           timestamp: Date.now(),
//           created_at: new Date().toISOString(),
//           status: 'sent'
//         };

//         set((state) => ({
//           messages: [...state.messages, userMessage],
//           isStreaming: true,
//           isMasterMode: false,
//           error: null,
//         }));

//         try {
//           const response = await apiClient.chat(agentId, currentSessionId, text);

//           const assistantMessage: Message = {
//             id: response.message_id || generateId(),
//             role: 'assistant',
//             content: response.content,
//             threadId: response.session_id || currentSessionId,
//             sessionId: response.session_id || currentSessionId,
//             timestamp: Date.now(),
//             created_at: response.created_at || new Date().toISOString(),
//             status: 'sent'
//           };

//           set((state) => ({
//             messages: [...state.messages, assistantMessage],
//             isStreaming: false,
//           }));

//           const { sessions } = get();
//           const currentSession = sessions.find((s) => s.id === currentSessionId);
//           if (currentSession && !currentSession.id) {
//             const title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
//             await get().renameSession(currentSessionId, title);
//           }
//         } catch (error) {
//           const errorMessage = error instanceof Error ? error.message : 'Ошибка отправки сообщения';

//           const errorMessageObj: Message = {
//             id: generateId(),
//             role: 'assistant',
//             content: `❌ Ошибка: ${errorMessage}`,
//             threadId: currentSessionId,
//             sessionId: currentSessionId,
//             timestamp: Date.now(),
//             created_at: new Date().toISOString(),
//             status: 'error'
//           };

//           set((state) => ({
//             messages: [...state.messages, errorMessageObj],
//             isStreaming: false,
//             error: errorMessage,
//           }));
//         }
//       },

//       // src/store/chatStore.ts

//       sendMessageStream: async (text: string, onChunk?: (chunk: string) => void) => {
//         const { agentId, currentSessionId } = get();

//         if (!agentId || !currentSessionId) {
//           set({ error: 'Не выбрана сессия или агент' });
//           return;
//         }

//         const userMessage: Message = {
//           id: generateId(),
//           role: 'user',
//           content: text,
//           threadId: currentSessionId,
//           sessionId: currentSessionId,
//           timestamp: Date.now(),
//           created_at: new Date().toISOString(),
//           status: 'sent'
//         };

//         set((state) => ({
//           messages: [...state.messages, userMessage],
//           isStreaming: true,
//           streamingMessage: '',
//           isMasterMode: false,
//           error: null,
//         }));

//         let fullContent = '';
//         const abortController = new AbortController();

//         try {
//           const generator = apiClient.streamChat(
//             agentId,
//             currentSessionId,
//             text,
//             undefined,
//             abortController.signal
//           );

//           for await (const chunk of generator) {
//             fullContent += chunk;
//             set({ streamingMessage: fullContent });
//             if (onChunk) onChunk(chunk);
//           }

//           if (!fullContent) {
//             throw new Error('Сервер вернул пустой ответ');
//           }

//           const assistantMessage: Message = {
//             id: generateId(),
//             role: 'assistant',
//             content: fullContent,
//             threadId: currentSessionId,
//             sessionId: currentSessionId,
//             timestamp: Date.now(),
//             created_at: new Date().toISOString(),
//             status: 'sent'
//           };

//           set((state) => ({
//             messages: [...state.messages, assistantMessage],
//             streamingMessage: '',
//             isStreaming: false,
//           }));

//           const { sessions } = get();
//           const currentSession = sessions.find((s) => s.id === currentSessionId);
//           if (currentSession && !currentSession.id) {
//             const title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
//             await get().renameSession(currentSessionId, title);
//           }
//         } catch (error) {
//           const errorMessage = error instanceof Error ? error.message : 'Ошибка стриминга';

//           if (fullContent) {
//             const assistantMessage: Message = {
//               id: generateId(),
//               role: 'assistant',
//               content: fullContent + '\n\n⚠️ Соединение было прервано, но часть ответа сохранена.',
//               threadId: currentSessionId,
//               sessionId: currentSessionId,
//               timestamp: Date.now(),
//               created_at: new Date().toISOString(),
//               status: 'sent'
//             };

//             set((state) => ({
//               messages: [...state.messages, assistantMessage],
//               streamingMessage: '',
//               isStreaming: false,
//             }));
//             return;
//           }

//           set({
//             streamingMessage: '',
//             isStreaming: false,
//             error: errorMessage,
//           });

//           const errorMessageObj: Message = {
//             id: generateId(),
//             role: 'assistant',
//             content: `❌ Ошибка: ${errorMessage}`,
//             threadId: currentSessionId,
//             sessionId: currentSessionId,
//             timestamp: Date.now(),
//             created_at: new Date().toISOString(),
//             status: 'error'
//           };

//           set((state) => ({
//             messages: [...state.messages, errorMessageObj],
//           }));
//         }
//       },

//       // === SMART CHAT (без привязки к агенту) ===

//       /**
//        * Умный чат без привязки к конкретному агенту
//        */
//       smartChat: async (text: string, context?: any) => {
//         set({ isLoading: true, error: null });

//         try {
//           const response = await apiClient.smartChat(text, get().agentId!, context);

//           // Добавляем сообщение пользователя
//           const userMessage: Message = {
//             id: generateId(),
//             role: 'user',
//             content: text,
//             threadId: 'smart-chat',
//             sessionId: 'smart-chat',
//             timestamp: Date.now(),
//             created_at: new Date().toISOString(),
//             status: 'sent'
//           };

//           // Добавляем ответ ассистента
//           const assistantMessage: Message = {
//             id: response.message_id || generateId(),
//             role: 'assistant',
//             content: response.content,
//             threadId: 'smart-chat',
//             sessionId: 'smart-chat',
//             timestamp: Date.now(),
//             created_at: response.created_at || new Date().toISOString(),
//             status: 'sent'
//           };

//           set((state) => ({
//             messages: [...state.messages, userMessage, assistantMessage],
//             isLoading: false,
//           }));
//         } catch (error) {
//           const errorMessage = error instanceof Error ? error.message : 'Ошибка Smart Chat';
//           set({ error: errorMessage, isLoading: false });

//           // Добавляем сообщение об ошибке
//           const errorMessageObj: Message = {
//             id: generateId(),
//             role: 'assistant',
//             content: `❌ Ошибка Smart Chat: ${errorMessage}`,
//             threadId: 'smart-chat',
//             sessionId: 'smart-chat',
//             timestamp: Date.now(),
//             created_at: new Date().toISOString(),
//             status: 'error'
//           };

//           set((state) => ({
//             messages: [...state.messages, errorMessageObj],
//           }));
//         }
//       },

//       /**
//        * Умный чат со стримингом (без привязки к агенту)
//        */
//       smartChatStream: async (text: string, onChunk?: (chunk: string) => void) => {
//         const { agentId } = get();
//         const { currentSessionId } = get();
//         const { firstRequest } = get();

//         set({
//           isLoading: true,
//           error: null,
//           isStreaming: true,
//           streamingMessage: '',
//         });

//         const userMessage: Message = {
//           id: generateId(),
//           role: 'user',
//           content: text,
//           threadId: 'smart-chat',
//           sessionId: 'smart-chat',
//           timestamp: Date.now(),
//           created_at: new Date().toISOString(),
//           status: 'sent'
//         };

//         set((state) => ({
//           messages: [...state.messages, userMessage],
//         }));

//         let fullContent = '';
//         const abortController = new AbortController();

//         try {
//           // const generator = agentId != null
//           //   ?
//           //   () => {
//           //     return (
//           //       currentSessionId != null
//           //         ? apiClient.smartChatStream(
//           //           text,
//           //           agentId || '',
//           //           currentSessionId,
//           //           undefined,
//           //           abortController.signal
//           //         )
//           //         : apiClient.smartChatStream(
//           //           text,
//           //           agentId || '',
//           //           null,
//           //           undefined,
//           //           abortController.signal
//           //         )
//           //     )
//           //   }(),

//           // const generator = currentSessionId != null
//           //   ? apiClient.smartChatStream(
//           //     text,
//           //     agentId || '',
//           //     currentSessionId,
//           //     undefined,
//           //     abortController.signal
//           //   )
//           //   : apiClient.smartChatStream(
//           //     text,
//           //     agentId || '',
//           //     null,
//           //     undefined,
//           //     abortController.signal
//           //   );

//           const generator = firstRequest != false
//             ?
//             currentSessionId != null
//               ? apiClient.smartChatStream(
//                 text,
//                 agentId || '',
//                 currentSessionId,
//                 undefined,
//                 abortController.signal
//               )
//               :
//               apiClient.smartChatStream(
//                 text,
//                 agentId || '',
//                 null,
//                 undefined,
//                 abortController.signal
//               )
//             :
//             currentSessionId != null
//               ?
//               apiClient.smartChatStream(
//                 text,
//                 agentId || '',
//                 currentSessionId,
//                 undefined,
//                 abortController.signal
//               )
//               :
//               apiClient.smartChatStream(
//                 text,
//                 agentId || '',
//                 null,
//                 undefined,
//                 abortController.signal
//               )






//           for await (const chunk of generator) {
//             // Выводим только токены
//             if (chunk.token) {
//               fullContent += chunk.token;
//               // if (chunk.message_id)
//               set({ streamingMessage: fullContent });
//               if (onChunk) onChunk(chunk.token);
//             }
//           }

//           if (!fullContent) {
//             throw new Error('Smart Chat вернул пустой ответ');
//           }

//           const assistantMessage: Message = {
//             id: generateId(),
//             role: 'assistant',
//             content: fullContent,
//             threadId: 'smart-chat',
//             sessionId: 'smart-chat',
//             timestamp: Date.now(),
//             created_at: new Date().toISOString(),
//             status: 'sent'
//           };

//           set((state) => ({
//             messages: [...state.messages, assistantMessage],
//             streamingMessage: '',
//             isStreaming: false,
//             isLoading: false,
//           }));

//         } catch (error) {
//           const errorMessage = error instanceof Error ? error.message : 'Ошибка Smart Chat';

//           if (fullContent) {
//             const assistantMessage: Message = {
//               id: generateId(),
//               role: 'assistant',
//               content: fullContent + '\n\n⚠️ Соединение было прервано, но часть ответа сохранена.',
//               threadId: 'smart-chat',
//               sessionId: 'smart-chat',
//               timestamp: Date.now(),
//               created_at: new Date().toISOString(),
//               status: 'sent'
//             };

//             set((state) => ({
//               messages: [...state.messages, assistantMessage],
//               streamingMessage: '',
//               isStreaming: false,
//               isLoading: false,
//             }));
//             return;
//           }

//           set({
//             streamingMessage: '',
//             isStreaming: false,
//             isLoading: false,
//             error: errorMessage,
//           });

//           const errorMessageObj: Message = {
//             id: generateId(),
//             role: 'assistant',
//             content: `❌ ${errorMessage}`,
//             threadId: 'smart-chat',
//             sessionId: 'smart-chat',
//             timestamp: Date.now(),
//             created_at: new Date().toISOString(),
//             status: 'error'
//           };

//           set((state) => ({
//             messages: [...state.messages, errorMessageObj],
//           }));
//         }
//       },

//       clearMessages: () => {
//         set({
//           messages: [WELCOME_MESSAGE],
//           streamingMessage: '',
//           error: null,
//           activeCitations: [],
//         });
//       },

//       // === Обратная связь ===

//       // setFeedback: async (messageId: string, rating: 'positive' | 'negative', comment?: string) => {
//       setFeedback: async (messageId: string, vote: number, comment?: string) => {
//         const { agentId } = get();
//         if (!agentId) {
//           set({ error: 'Agent ID не установлен' });
//           return;
//         }

//         set({ isLoading: true, error: null });

//         try {
//           await apiClient.setFeedback(agentId, messageId, vote, comment);
//           set({ isLoading: false });
//         } catch (error) {
//           const errorMessage = error instanceof Error ? error.message : 'Ошибка отправки反馈';
//           set({ error: errorMessage, isLoading: false });
//         }
//       },

//       getFeedback: async (messageId: string) => {
//         const { agentId } = get();
//         if (!agentId) {
//           set({ error: 'Agent ID не установлен' });
//           return null;
//         }

//         try {
//           return await apiClient.getFeedback(agentId, messageId);
//         } catch (error) {
//           const errorMessage = error instanceof Error ? error.message : 'Ошибка получения反馈';
//           set({ error: errorMessage });
//           return null;
//         }
//       },

//       deleteFeedback: async (messageId: string) => {
//         const { agentId } = get();
//         if (!agentId) {
//           set({ error: 'Agent ID не установлен' });
//           return;
//         }

//         set({ isLoading: true, error: null });

//         try {
//           await apiClient.deleteFeedback(agentId, messageId);
//           set({ isLoading: false });
//         } catch (error) {
//           const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления反馈';
//           set({ error: errorMessage, isLoading: false });
//         }
//       },

//       // === Управление цитатами ===

//       setCitations: (citations: Citation[]) => {
//         // set({ activeCitations: citations });
//         if (citations) {
//           citations.forEach((citation) => {
//             set({ activeCitations: [...get().activeCitations, citation] })
//           })
//         }
//       },

//       toggleCitationsPanel: () => {
//         set((state) => ({ showCitationsPanel: !state.showCitationsPanel }));
//       },

//       // === Управление состоянием ===

//       setStreaming: (isStreaming: boolean) => {
//         set({ isStreaming });
//       },

//       setError: (error: string | null) => {
//         set({ error });
//       },

//       setMasterMode: (enabled: boolean) => {
//         set({ isMasterMode: enabled });
//       },
//     }),
//     { name: 'chat-store' }
//   )
// );

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/chatStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '../services/api';
import type {
  Message,
  Citation,
  ChatState,
  ChatActions,
} from '../types/chat';
import { generateId } from '../utils/id';

type ChatStore = ChatState & ChatActions;

// Начальное приветственное сообщение
const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Привет! Я твой AI-помощник. Задай вопрос или загрузи файл.',
  threadId: '',
  sessionId: '',
  timestamp: Date.now(),
  created_at: new Date().toISOString(),
  status: 'sent'
};

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      // === Начальное состояние ===
      agentId: null,
      sessions: [],
      currentSessionId: null,
      messages: [WELCOME_MESSAGE],
      isStreaming: false,
      streamingMessage: '',
      activeCitations: [],
      showCitationsPanel: true,
      error: null,
      isLoading: false,
      isMasterMode: true,

      // === Управление агентом и сессиями ===

      setAgentId: (agentId: string) => {
        set({ agentId });
        get().loadSessions();
      },

      createSession: async () => {
        const { agentId } = get();
        if (!agentId) {
          console.warn('❌ Agent ID не установлен, сессия не создана');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const session = await apiClient.createSession(agentId);

          set((state) => ({
            sessions: [session, ...state.sessions],
            currentSessionId: session.id,
            messages: [WELCOME_MESSAGE],
            isLoading: false,
          }));

          return session.id;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Ошибка создания сессии';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      loadSessions: async () => {
        const { agentId } = get();
        if (!agentId) {
          console.warn('ℹ️ Agent ID не установлен, пропускаем загрузку сессий');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const sessions = await apiClient.listSessions(agentId);

          set({
            sessions,
            isLoading: false,
          });

          if (sessions.length > 0 && !get().currentSessionId) {
            await get().setActiveSession(sessions[0].id);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки сессий';
          set({ error: errorMessage, isLoading: false });
        }
      },

      setActiveSession: async (sessionId: string) => {
        const { sessions, agentId } = get();
        const session = sessions.find((s) => s.id === sessionId);

        if (!session) {
          set({ error: 'Сессия не найдена' });
          return;
        }

        set({
          currentSessionId: sessionId,
          activeCitations: [],
          showCitationsPanel: false,
          error: null,
        });

        if (agentId) {
          await get().loadSessionMessages(sessionId);
        }
      },

      renameSession: async (sessionId: string, name: string) => {
        const { agentId } = get();
        if (!agentId) {
          console.warn('ℹ️ Agent ID не установлен, пропускаем переименование');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const updatedSession = await apiClient.renameSession(agentId, sessionId, name);

          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? updatedSession : s
            ),
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Ошибка переименования сессии';
          set({ error: errorMessage, isLoading: false });
        }
      },

      deleteSession: async (sessionId: string) => {
        const { agentId } = get();
        if (!agentId) {
          console.warn('ℹ️ Agent ID не установлен, пропускаем удаление');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          await apiClient.deleteSession(agentId, sessionId);

          set((state) => {
            const filteredSessions = state.sessions.filter((s) => s.id !== sessionId);
            const isActiveSession = state.currentSessionId === sessionId;

            return {
              sessions: filteredSessions,
              currentSessionId: isActiveSession && filteredSessions.length > 0
                ? filteredSessions[0].id
                : isActiveSession ? null : state.currentSessionId,
              messages: isActiveSession ? [WELCOME_MESSAGE] : state.messages,
              isLoading: false,
            };
          });

          const newState = get();
          if (newState.currentSessionId && agentId) {
            await get().loadSessionMessages(newState.currentSessionId);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления сессии';
          set({ error: errorMessage, isLoading: false });
        }
      },

      // === Работа с сообщениями ===

      loadSessionMessages: async (sessionId: string) => {
        const { agentId } = get();
        if (!agentId) {
          console.warn('ℹ️ Agent ID не установлен, пропускаем загрузку сообщений');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const messages = await apiClient.getSessionMessages(agentId, sessionId);

          const formattedMessages: Message[] = messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            threadId: msg.session_id,
            sessionId: msg.session_id,
            timestamp: Date.now(),
            created_at: msg.created_at || new Date().toISOString(),
            status: 'sent' as const
          }));

          const finalMessages = formattedMessages.length > 0 ? formattedMessages : [WELCOME_MESSAGE];

          set({
            messages: finalMessages,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки сообщений';
          set({ error: errorMessage, isLoading: false });
        }
      },

      // === Методы для работы со стримингом ===

      addMessage: (message: Message) => {
        set((state) => ({
          messages: [...state.messages, message],
          error: null,
        }));
      },

      appendToStreamingMessage: (chunk: string) => {
        set((state) => ({
          streamingMessage: state.streamingMessage + chunk,
        }));
      },

      finalizeStreamingMessage: (finalMessage: Message) => {
        set((state) => {
          const messagesWithoutStreaming = state.messages.filter(
            (msg) => msg.id !== 'streaming-temp'
          );

          return {
            messages: [...messagesWithoutStreaming, finalMessage],
            streamingMessage: '',
            isStreaming: false,
          };
        });
      },

      setIsLoading: (isLoading: boolean) => {
        set({ isLoading });
      },

      // === Обычный чат (с агентом) ===

      sendMessage: async (text: string) => {
        const { agentId, currentSessionId } = get();

        if (!agentId || !currentSessionId) {
          console.warn('ℹ️ Не выбрана сессия или агент');
          set({ error: 'Не выбрана сессия или агент' });
          return;
        }

        const userMessage: Message = {
          id: generateId(),
          role: 'user',
          content: text,
          threadId: currentSessionId,
          sessionId: currentSessionId,
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
          status: 'sent'
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          isStreaming: true,
          isMasterMode: false,
          error: null,
        }));

        try {
          const response = await apiClient.chat(agentId, currentSessionId, text);

          const assistantMessage: Message = {
            id: response.message_id || generateId(),
            role: 'assistant',
            content: response.content,
            threadId: response.session_id || currentSessionId,
            sessionId: response.session_id || currentSessionId,
            timestamp: Date.now(),
            created_at: response.created_at || new Date().toISOString(),
            status: 'sent'
          };

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            isStreaming: false,
          }));

          const { sessions } = get();
          const currentSession = sessions.find((s) => s.id === currentSessionId);
          if (currentSession && !currentSession.id) {
            const title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
            await get().renameSession(currentSessionId, title);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Ошибка отправки сообщения';

          const errorMessageObj: Message = {
            id: generateId(),
            role: 'assistant',
            content: `❌ Ошибка: ${errorMessage}`,
            threadId: currentSessionId,
            sessionId: currentSessionId,
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: 'error'
          };

          set((state) => ({
            messages: [...state.messages, errorMessageObj],
            isStreaming: false,
            error: errorMessage,
          }));
        }
      },

      sendMessageStream: async (text: string, onChunk?: (chunk: string) => void) => {
        const { agentId, currentSessionId } = get();

        if (!agentId || !currentSessionId) {
          console.warn('ℹ️ Не выбрана сессия или агент');
          set({ error: 'Не выбрана сессия или агент' });
          return;
        }

        const userMessage: Message = {
          id: generateId(),
          role: 'user',
          content: text,
          threadId: currentSessionId,
          sessionId: currentSessionId,
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
          status: 'sent'
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          isStreaming: true,
          streamingMessage: '',
          isMasterMode: false,
          error: null,
        }));

        let fullContent = '';
        const abortController = new AbortController();

        try {
          const generator = apiClient.streamChat(
            agentId,
            currentSessionId,
            text,
            undefined,
            abortController.signal
          );

          for await (const chunk of generator) {
            fullContent += chunk;
            set({ streamingMessage: fullContent });
            if (onChunk) onChunk(chunk);
          }

          if (!fullContent) {
            throw new Error('Сервер вернул пустой ответ');
          }

          const assistantMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: fullContent,
            threadId: currentSessionId,
            sessionId: currentSessionId,
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: 'sent'
          };

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            streamingMessage: '',
            isStreaming: false,
          }));

          const { sessions } = get();
          const currentSession = sessions.find((s) => s.id === currentSessionId);
          if (currentSession && !currentSession.id) {
            const title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
            await get().renameSession(currentSessionId, title);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Ошибка стриминга';

          if (fullContent) {
            const assistantMessage: Message = {
              id: generateId(),
              role: 'assistant',
              content: fullContent + '\n\n⚠️ Соединение было прервано, но часть ответа сохранена.',
              threadId: currentSessionId,
              sessionId: currentSessionId,
              timestamp: Date.now(),
              created_at: new Date().toISOString(),
              status: 'sent'
            };

            set((state) => ({
              messages: [...state.messages, assistantMessage],
              streamingMessage: '',
              isStreaming: false,
            }));
            return;
          }

          set({
            streamingMessage: '',
            isStreaming: false,
            error: errorMessage,
          });

          const errorMessageObj: Message = {
            id: generateId(),
            role: 'assistant',
            content: `❌ Ошибка: ${errorMessage}`,
            threadId: currentSessionId,
            sessionId: currentSessionId,
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: 'error'
          };

          set((state) => ({
            messages: [...state.messages, errorMessageObj],
          }));
        }
      },

      // === SMART CHAT (без привязки к агенту) ===

      /**
       * Умный чат без привязки к конкретному агенту
       */
      smartChat: async (text: string, context?: any) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.smartChat(text, get().agentId!, context);

          // Добавляем сообщение пользователя
          const userMessage: Message = {
            id: generateId(),
            role: 'user',
            content: text,
            threadId: 'smart-chat',
            sessionId: 'smart-chat',
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: 'sent'
          };

          // Добавляем ответ ассистента
          const assistantMessage: Message = {
            id: response.message_id || generateId(),
            role: 'assistant',
            content: response.content,
            threadId: 'smart-chat',
            sessionId: 'smart-chat',
            timestamp: Date.now(),
            created_at: response.created_at || new Date().toISOString(),
            status: 'sent'
          };

          set((state) => ({
            messages: [...state.messages, userMessage, assistantMessage],
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Ошибка Smart Chat';
          set({ error: errorMessage, isLoading: false });

          // Добавляем сообщение об ошибке
          const errorMessageObj: Message = {
            id: generateId(),
            role: 'assistant',
            content: `❌ Ошибка Smart Chat: ${errorMessage}`,
            threadId: 'smart-chat',
            sessionId: 'smart-chat',
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: 'error'
          };

          set((state) => ({
            messages: [...state.messages, errorMessageObj],
          }));
        }
      },

      /**
       * Умный чат со стримингом (без привязки к агенту)
       * @param text - текст сообщения
       * @param agentId - опциональный ID агента (для ручного выбора)
       * @param onChunk - колбэк для получения чанков
       */
      // smartChatStream: async (text: string, agentId?: string, onChunk?: (chunk: string) => void) => {
      //   const { currentSessionId, isMasterMode } = get();

      //   console.log('🚀 [chatStore.smartChatStream] Вызов:', {
      //     text: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
      //     agentId: agentId || 'не указан (мастер-режим)',
      //     currentSessionId: currentSessionId || 'не указан',
      //     isMasterMode: isMasterMode
      //   });

      //   set({
      //     isLoading: true,
      //     error: null,
      //     isStreaming: true,
      //     streamingMessage: '',
      //   });

      //   const userMessage: Message = {
      //     id: generateId(),
      //     role: 'user',
      //     content: text,
      //     threadId: 'smart-chat',
      //     sessionId: 'smart-chat',
      //     timestamp: Date.now(),
      //     created_at: new Date().toISOString(),
      //     status: 'sent'
      //   };

      //   set((state) => ({
      //     messages: [...state.messages, userMessage],
      //   }));

      //   let fullContent = '';
      //   let sessionCreated = false;
      //   const abortController = new AbortController();

      //   try {
      //     // ========== 🔧 ГЛАВНОЕ ИСПРАВЛЕНИЕ ==========
      //     // В мастер-режиме НЕ ПЕРЕДАЁМ session_id
      //     // session_id передаём ТОЛЬКО если:
      //     // 1. Мы НЕ в мастер-режиме
      //     // 2. И есть currentSessionId
      //     const shouldSendSessionId = !isMasterMode && currentSessionId;

      //     console.log('📤 [chatStore] Параметры отправки:', {
      //       shouldSendSessionId,
      //       sessionIdToSend: shouldSendSessionId ? currentSessionId : null,
      //       isMasterMode
      //     });

      //     const generator = apiClient.smartChatStream(
      //       text,
      //       agentId,
      //       shouldSendSessionId ? currentSessionId : null, // <-- null в мастер-режиме
      //       undefined,
      //       abortController.signal
      //     );
      //     // ==========================================

      //     for await (const chunk of generator) {
      //       console.log('📥 [chatStore.smartChatStream] Получен chunk:', {
      //         hasAgentId: !!chunk.agentId,
      //         hasSessionId: !!chunk.sessionId,
      //         hasToken: !!chunk.token,
      //         hasDone: !!chunk.done,
      //         agentId: chunk.agentId,
      //         sessionId: chunk.sessionId,
      //         tokenLength: chunk.token?.length || 0
      //       });

      //       // ===== ОБРАБОТКА МЕТАДАННЫХ (заголовки от бекенда) =====
      //       if (chunk.agentId || chunk.sessionId) {
      //         console.log('🎯 [chatStore.smartChatStream] Получены метаданные!', {
      //           newAgentId: chunk.agentId,
      //           newSessionId: chunk.sessionId,
      //           oldAgentId: get().agentId,
      //           oldSessionId: get().currentSessionId
      //         });

      //         const updates: any = {};

      //         if (chunk.agentId) {
      //           updates.agentId = chunk.agentId;
      //           console.log('✅ [chatStore] Устанавливаем agentId:', chunk.agentId);
      //         }

      //         if (chunk.sessionId) {
      //           updates.currentSessionId = chunk.sessionId;
      //           console.log('✅ [chatStore] Устанавливаем sessionId:', chunk.sessionId);
      //           sessionCreated = true;
      //         }

      //         // Выходим из мастер-режима
      //         updates.isMasterMode = false;
      //         console.log('🔄 [chatStore] Выход из мастер-режима');

      //         set(updates);

      //         console.log('📊 [chatStore] Состояние после обновления:', {
      //           agentId: get().agentId,
      //           currentSessionId: get().currentSessionId,
      //           isMasterMode: get().isMasterMode
      //         });

      //         // Загружаем сообщения сессии если есть sessionId и agentId
      //         if (chunk.sessionId && chunk.agentId) {
      //           console.log('📥 [chatStore] Загружаем сообщения для сессии:', chunk.sessionId);
      //           await get().loadSessionMessages(chunk.sessionId);
      //         }
      //         continue;
      //       }

      //       // Обработка токенов
      //       if (chunk.token) {
      //         fullContent += chunk.token;
      //         set({ streamingMessage: fullContent });
      //         if (onChunk) onChunk(chunk.token);
      //       }
      //     }

      //     console.log('✅ [chatStore.smartChatStream] Стрим завершен. Длина ответа:', fullContent.length);

      //     if (!fullContent) {
      //       throw new Error('Smart Chat вернул пустой ответ');
      //     }

      //     const assistantMessage: Message = {
      //       id: generateId(),
      //       role: 'assistant',
      //       content: fullContent,
      //       threadId: 'smart-chat',
      //       sessionId: 'smart-chat',
      //       timestamp: Date.now(),
      //       created_at: new Date().toISOString(),
      //       status: 'sent'
      //     };

      //     set((state) => ({
      //       messages: [...state.messages, assistantMessage],
      //       streamingMessage: '',
      //       isStreaming: false,
      //       isLoading: false,
      //     }));

      //     console.log('📝 [chatStore] Сообщение ассистента добавлено');

      //   } catch (error) {
      //     console.error('❌ [chatStore.smartChatStream] Ошибка:', error);

      //     const errorMessage = error instanceof Error ? error.message : 'Ошибка Smart Chat';

      //     if (fullContent) {
      //       const assistantMessage: Message = {
      //         id: generateId(),
      //         role: 'assistant',
      //         content: fullContent + '\n\n⚠️ Соединение было прервано, но часть ответа сохранена.',
      //         threadId: 'smart-chat',
      //         sessionId: 'smart-chat',
      //         timestamp: Date.now(),
      //         created_at: new Date().toISOString(),
      //         status: 'sent'
      //       };

      //       set((state) => ({
      //         messages: [...state.messages, assistantMessage],
      //         streamingMessage: '',
      //         isStreaming: false,
      //         isLoading: false,
      //       }));
      //       return;
      //     }

      //     set({
      //       streamingMessage: '',
      //       isStreaming: false,
      //       isLoading: false,
      //       error: errorMessage,
      //     });

      //     const errorMessageObj: Message = {
      //       id: generateId(),
      //       role: 'assistant',
      //       content: `❌ ${errorMessage}`,
      //       threadId: 'smart-chat',
      //       sessionId: 'smart-chat',
      //       timestamp: Date.now(),
      //       created_at: new Date().toISOString(),
      //       status: 'error'
      //     };

      //     set((state) => ({
      //       messages: [...state.messages, errorMessageObj],
      //     }));
      //   }
      // },

      smartChatStream: async (text: string, onChunk?: (chunk: string) => void) => {
        const { agentId, currentSessionId, isMasterMode } = get();

        console.log('🚀 [chatStore.smartChatStream] Вызов:', {
          text: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
          agentId: agentId || 'не указан',
          currentSessionId: currentSessionId || 'не указан',
          isMasterMode: isMasterMode
        });

        set({
          isLoading: true,
          error: null,
          isStreaming: true,
          streamingMessage: '',
        });

        const userMessage: Message = {
          id: generateId(),
          role: 'user',
          content: text,
          threadId: currentSessionId || 'smart-chat',
          sessionId: currentSessionId || 'smart-chat',
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
          status: 'sent'
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
        }));

        let fullContent = '';
        const abortController = new AbortController();

        try {
          // Определяем, что передавать в API
          // Если есть agentId и currentSessionId - передаем их
          // Если нет - не передаем (первый запрос в мастер-режиме)
          const apiAgentId = agentId || undefined;
          const apiSessionId = currentSessionId || undefined;

          console.log('📤 [chatStore] Параметры для API:', {
            apiAgentId: apiAgentId || 'не передан',
            apiSessionId: apiSessionId || 'не передан'
          });

          const generator = apiClient.smartChatStream(
            text,
            apiAgentId,
            apiSessionId,
            undefined,
            abortController.signal
          );

          for await (const chunk of generator) {
            console.log('📥 [chatStore] Получен чанк:', chunk);

            // Обработка метаданных от бекенда
            if (chunk.agentId || chunk.sessionId) {
              console.log('🎯 [chatStore] Получены метаданные:', {
                newAgentId: chunk.agentId,
                newSessionId: chunk.sessionId
              });

              const updates: Partial<ChatState> = {};

              if (chunk.agentId) {
                updates.agentId = chunk.agentId;
                console.log('✅ [chatStore] Устанавливаем agentId:', chunk.agentId);
              }

              if (chunk.sessionId) {
                updates.currentSessionId = chunk.sessionId;
                console.log('✅ [chatStore] Устанавливаем sessionId:', chunk.sessionId);
              }

              // Выходим из мастер-режима после получения метаданных
              updates.isMasterMode = false;
              console.log('🔄 [chatStore] Выход из мастер-режима');

              set(updates);

              // Загружаем сессии и сообщения после получения ID
              if (chunk.agentId && chunk.sessionId) {
                // Загружаем сессии для нового агента
                try {
                  await get().loadSessions();
                } catch (err) {
                  console.warn('⚠️ [chatStore] Не удалось загрузить сессии:', err);
                }

                // // Загружаем сообщения новой сессии
                // try {
                //   await get().loadSessionMessages(chunk.sessionId);
                // } catch (err) {
                //   console.warn('⚠️ [chatStore] Не удалось загрузить сообщения:', err);
                // }
              }

              continue; // Пропускаем, так как это не токен
            }

            // Обработка токенов
            if (chunk.token) {
              fullContent += chunk.token;
              set({ streamingMessage: fullContent });
              if (onChunk) onChunk(chunk.token);
            }

            // Обработка завершения
            if (chunk.done) {
              console.log('✅ [chatStore] Получен сигнал завершения');
              break;
            }
          }

          console.log('✅ [chatStore] Стрим завершен. Длина ответа:', fullContent.length);

          if (!fullContent) {
            throw new Error('Smart Chat вернул пустой ответ');
          }

          const { currentSessionId: finalSessionId } = get();

          const assistantMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: fullContent,
            threadId: finalSessionId || 'smart-chat',
            sessionId: finalSessionId || 'smart-chat',
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: 'sent'
          };

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            streamingMessage: '',
            isStreaming: false,
            isLoading: false,
          }));

          console.log('📝 [chatStore] Сообщение ассистента добавлено');

        } catch (error) {
          console.error('❌ [chatStore.smartChatStream] Ошибка:', error);

          const errorMessage = error instanceof Error ? error.message : 'Ошибка Smart Chat';

          if (fullContent) {
            const assistantMessage: Message = {
              id: generateId(),
              role: 'assistant',
              content: fullContent + '\n\n⚠️ Соединение было прервано, но часть ответа сохранена.',
              threadId: currentSessionId || 'smart-chat',
              sessionId: currentSessionId || 'smart-chat',
              timestamp: Date.now(),
              created_at: new Date().toISOString(),
              status: 'sent'
            };

            set((state) => ({
              messages: [...state.messages, assistantMessage],
              streamingMessage: '',
              isStreaming: false,
              isLoading: false,
            }));
            return;
          }

          set({
            streamingMessage: '',
            isStreaming: false,
            isLoading: false,
            error: errorMessage,
          });

          const errorMessageObj: Message = {
            id: generateId(),
            role: 'assistant',
            content: `❌ ${errorMessage}`,
            threadId: currentSessionId || 'smart-chat',
            sessionId: currentSessionId || 'smart-chat',
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: 'error'
          };

          set((state) => ({
            messages: [...state.messages, errorMessageObj],
          }));
        }
      },

      clearMessages: () => {
        set({
          messages: [WELCOME_MESSAGE],
          streamingMessage: '',
          error: null,
          activeCitations: [],
        });
      },

      // === Обратная связь ===

      setFeedback: async (messageId: string, vote: number, comment?: string) => {
        const { agentId } = get();
        if (!agentId) {
          console.warn('ℹ️ Agent ID не установлен, пропускаем отправку feedback');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          await apiClient.setFeedback(agentId, messageId, vote, comment);
          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Ошибка отправки feedback';
          set({ error: errorMessage, isLoading: false });
        }
      },

      getFeedback: async (messageId: string) => {
        const { agentId } = get();
        if (!agentId) {
          console.warn('ℹ️ Agent ID не установлен, пропускаем получение feedback');
          return null;
        }

        try {
          return await apiClient.getFeedback(agentId, messageId);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Ошибка получения feedback';
          set({ error: errorMessage });
          return null;
        }
      },

      deleteFeedback: async (messageId: string) => {
        const { agentId } = get();
        if (!agentId) {
          console.warn('ℹ️ Agent ID не установлен, пропускаем удаление feedback');
          return;
        }

        set({ isLoading: true, error: null });

        try {
          await apiClient.deleteFeedback(agentId, messageId);
          set({ isLoading: false });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Ошибка удаления feedback';
          set({ error: errorMessage, isLoading: false });
        }
      },

      // === Управление цитатами ===

      setCitations: (citations: Citation[]) => {
        if (citations) {
          citations.forEach((citation) => {
            set({ activeCitations: [...get().activeCitations, citation] })
          })
        }
      },

      toggleCitationsPanel: () => {
        set((state) => ({ showCitationsPanel: !state.showCitationsPanel }));
      },

      // === Управление состоянием ===

      setStreaming: (isStreaming: boolean) => {
        set({ isStreaming });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setMasterMode: (enabled: boolean) => {
        set({ isMasterMode: enabled });
      },
    }),
    { name: 'chat-store' }
  )
);