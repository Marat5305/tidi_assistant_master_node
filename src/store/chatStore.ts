/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/store/chatStore.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { apiClient } from "../services/api";
import type { Message, Citation, ChatState, ChatActions } from "../types/chat";
import { generateId } from "../utils/id";
import { validateFile } from "../config/ocr";
import type { FileAttachment } from "../types/chat";
import type { AllAgentsSessions } from "../types/chat";

type ChatStore = ChatState & ChatActions & AllAgentsSessions;

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Привет! Я твой AI-помощник. Задай вопрос или загрузи файл.",
  threadId: "",
  sessionId: "",
  timestamp: Date.now(),
  created_at: new Date().toISOString(),
  status: "sent",
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
      streamingMessage: "",
      activeCitations: [],
      showCitationsPanel: true,
      error: null,
      isLoading: false,
      // isMasterMode: true,
      isMasterMode: false,
      uploadingFiles: [],
      agents_list: [],

      // === Управление агентом и сессиями ===

      // В chatStore.ts
      setAgentId: (agentId: string) => {
        const previousAgentId = get().agentId;

        if (!agentId) {
          set({
            agentId: null,
            currentSessionId: null,
            sessions: [],
          });
          return;
        }

        set({ agentId });

        // Загружаем сессии если агент изменился
        if (agentId !== previousAgentId) {
          console.log('🔄 [setAgentId] Загружаем сессии для агента:', agentId);
          get().loadSessions();
        }
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
            isMasterMode: false,
          }));

          return session.id;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Ошибка создания сессии";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      loadSessions: async () => {
        const { agentId, isLoading } = get();

        if (isLoading) {
          console.log('⏳ Загрузка сессий уже выполняется, пропускаем...');
          return;
        }

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
          const errorMessage =
            error instanceof Error ? error.message : "Ошибка загрузки сессий";
          set({ error: errorMessage, isLoading: false });
        }
      },

      getAllAgentsSessions: async () => {
        set({ isLoading: true, error: null });

        try {
          const list = await apiClient.allAgentsSessions();

          const hasSessions = list.some(
            agent => agent.sessions && agent.sessions.length > 0
          );

          if (!hasSessions) {
            console.log('⚠️ Нет сессий ни у одного агента');
          }

          set({
            agents_list: list,
            isLoading: false
          });

          return list;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Ошибка загрузки сессий";
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      setActiveSession: async (sessionId: string) => {
        const { sessions, agentId } = get();
        const session = sessions.find((s) => s.id === sessionId);

        if (!session) {
          set({ error: "Сессия не найдена" });
          return;
        }

        set({
          currentSessionId: sessionId,
          activeCitations: [],
          showCitationsPanel: false,
          error: null,
          isMasterMode: false,
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
          const updatedSession = await apiClient.renameSession(
            agentId,
            sessionId,
            name,
          );

          set((state) => ({
            sessions: state.sessions.map((s) =>
              s.id === sessionId ? updatedSession : s,
            ),
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Ошибка переименования сессии";
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
            const filteredSessions = state.sessions.filter(
              (s) => s.id !== sessionId,
            );
            const isActiveSession = state.currentSessionId === sessionId;

            return {
              sessions: filteredSessions,
              currentSessionId:
                isActiveSession && filteredSessions.length > 0
                  ? filteredSessions[0].id
                  : isActiveSession
                    ? null
                    : state.currentSessionId,
              messages: isActiveSession ? [WELCOME_MESSAGE] : state.messages,
              isLoading: false,
              isMasterMode: isActiveSession ? true : state.isMasterMode,
            };
          });

          const newState = get();
          if (newState.currentSessionId && agentId) {
            await get().loadSessionMessages(newState.currentSessionId);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Ошибка удаления сессии";
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
          const messages = await apiClient.getSessionMessages(
            agentId,
            sessionId,
          );

          const formattedMessages: Message[] = messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            threadId: msg.session_id,
            sessionId: msg.session_id,
            timestamp: Date.now(),
            created_at: msg.created_at || new Date().toISOString(),
            status: "sent" as const,
          }));

          const finalMessages =
            formattedMessages.length > 0
              ? formattedMessages
              : [WELCOME_MESSAGE];

          set({
            messages: finalMessages,
            isLoading: false,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Ошибка загрузки сообщений";
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
            (msg) => msg.id !== "streaming-temp",
          );

          return {
            messages: [...messagesWithoutStreaming, finalMessage],
            streamingMessage: "",
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
          role: "user",
          content: text,
          threadId: currentSessionId,
          sessionId: currentSessionId,
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
          status: "sent",
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          isStreaming: true,
          isMasterMode: false,
          error: null,
        }));

        try {
          const response = await apiClient.chat(
            agentId,
            currentSessionId,
            text,
          );

          const assistantMessage: Message = {
            id: response.message_id || generateId(),
            role: "assistant",
            content: response.content,
            threadId: response.session_id || currentSessionId,
            sessionId: response.session_id || currentSessionId,
            timestamp: Date.now(),
            created_at: response.created_at || new Date().toISOString(),
            status: "sent",
          };

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            isStreaming: false,
          }));

          const { sessions } = get();
          const currentSession = sessions.find(
            (s) => s.id === currentSessionId,
          );
          if (currentSession && !currentSession.id) {
            const title = text.slice(0, 30) + (text.length > 30 ? "..." : "");
            await get().renameSession(currentSessionId, title);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Ошибка отправки сообщения";

          const errorMessageObj: Message = {
            id: generateId(),
            role: "assistant",
            content: `❌ Ошибка: ${errorMessage}`,
            threadId: currentSessionId,
            sessionId: currentSessionId,
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: "error",
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
          role: "user",
          content: text,
          threadId: currentSessionId,
          sessionId: currentSessionId,
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
          status: "sent",
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          isStreaming: true,
          streamingMessage: "",
          isMasterMode: false,
          error: null,
        }));

        let fullContent = "";
        const abortController = new AbortController();

        try {
          const generator = apiClient.streamChat(
            agentId,
            currentSessionId,
            text,
            undefined,
            abortController.signal,
          );

          for await (const chunk of generator) {
            fullContent += chunk;
            set({ streamingMessage: fullContent });
            if (onChunk) onChunk(chunk);
          }

          if (!fullContent) {
            throw new Error("Сервер вернул пустой ответ");
          }

          const assistantMessage: Message = {
            id: generateId(),
            role: "assistant",
            content: fullContent,
            threadId: currentSessionId,
            sessionId: currentSessionId,
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: "sent",
          };

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            streamingMessage: "",
            isStreaming: false,
          }));

          const { sessions } = get();
          const currentSession = sessions.find(
            (s) => s.id === currentSessionId,
          );
          if (currentSession && !currentSession.id) {
            const title = text.slice(0, 30) + (text.length > 30 ? "..." : "");
            await get().renameSession(currentSessionId, title);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Ошибка стриминга";

          if (fullContent) {
            const assistantMessage: Message = {
              id: generateId(),
              role: "assistant",
              content:
                fullContent +
                "\n\n⚠️ Соединение было прервано, но часть ответа сохранена.",
              threadId: currentSessionId,
              sessionId: currentSessionId,
              timestamp: Date.now(),
              created_at: new Date().toISOString(),
              status: "sent",
            };

            set((state) => ({
              messages: [...state.messages, assistantMessage],
              streamingMessage: "",
              isStreaming: false,
            }));
            return;
          }

          set({
            streamingMessage: "",
            isStreaming: false,
            error: errorMessage,
          });

          const errorMessageObj: Message = {
            id: generateId(),
            role: "assistant",
            content: `❌ Ошибка: ${errorMessage}`,
            threadId: currentSessionId,
            sessionId: currentSessionId,
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: "error",
          };

          set((state) => ({
            messages: [...state.messages, errorMessageObj],
          }));
        }
      },

      // === SMART CHAT ===

      smartChat: async (text: string, context?: any) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.smartChat(
            text,
            get().agentId!,
            context,
          );

          const userMessage: Message = {
            id: generateId(),
            role: "user",
            content: text,
            threadId: "smart-chat",
            sessionId: "smart-chat",
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: "sent",
          };

          const assistantMessage: Message = {
            id: response.message_id || generateId(),
            role: "assistant",
            content: response.content,
            threadId: "smart-chat",
            sessionId: "smart-chat",
            timestamp: Date.now(),
            created_at: response.created_at || new Date().toISOString(),
            status: "sent",
          };

          set((state) => ({
            messages: [...state.messages, userMessage, assistantMessage],
            isLoading: false,
          }));
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Ошибка Smart Chat";
          set({ error: errorMessage, isLoading: false });

          const errorMessageObj: Message = {
            id: generateId(),
            role: "assistant",
            content: `❌ Ошибка Smart Chat: ${errorMessage}`,
            threadId: "smart-chat",
            sessionId: "smart-chat",
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: "error",
          };

          set((state) => ({
            messages: [...state.messages, errorMessageObj],
          }));
        }
      },

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
          streamingMessage: "",
        });

        const userMessage: Message = {
          id: generateId(),
          role: "user",
          content: text,
          threadId: currentSessionId || 'smart-chat',
          sessionId: currentSessionId || 'smart-chat',
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
          status: "sent",
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
        }));

        let fullContent = "";
        const abortController = new AbortController();

        try {
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

              updates.isMasterMode = false;
              console.log('🔄 [chatStore] Выход из мастер-режима');

              set(updates);

              if (chunk.agentId && chunk.sessionId) {
                try {
                  await get().loadSessions();
                } catch (err) {
                  console.warn('⚠️ [chatStore] Не удалось загрузить сессии:', err);
                }
              }

              continue;
            }

            if (chunk.token) {
              fullContent += chunk.token;
              set({ streamingMessage: fullContent });
              if (onChunk) onChunk(chunk.token);
            }

            if (chunk.done) {
              console.log('✅ [chatStore] Получен сигнал завершения');
              break;
            }
          }

          console.log('✅ [chatStore] Стрим завершен. Длина ответа:', fullContent.length);

          if (!fullContent) {
            throw new Error("Smart Chat вернул пустой ответ");
          }

          const { currentSessionId: finalSessionId } = get();

          const assistantMessage: Message = {
            id: generateId(),
            role: "assistant",
            content: fullContent,
            threadId: finalSessionId || 'smart-chat',
            sessionId: finalSessionId || 'smart-chat',
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: "sent",
          };

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            streamingMessage: "",
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
              status: "sent",
            };

            set((state) => ({
              messages: [...state.messages, assistantMessage],
              streamingMessage: "",
              isStreaming: false,
              isLoading: false,
            }));
            return;
          }

          set({
            streamingMessage: "",
            isStreaming: false,
            isLoading: false,
            error: errorMessage,
          });

          const errorMessageObj: Message = {
            id: generateId(),
            role: "assistant",
            content: `❌ ${errorMessage}`,
            threadId: currentSessionId || 'smart-chat',
            sessionId: currentSessionId || 'smart-chat',
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: "error",
          };

          set((state) => ({
            messages: [...state.messages, errorMessageObj],
          }));
        }
      },

      clearMessages: () => {
        set({
          messages: [WELCOME_MESSAGE],
          streamingMessage: "",
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
            set({ activeCitations: [...get().activeCitations, citation] });
          });
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

      // === Управление файлами ===

      addFile: async (file: File) => {
        const validation = validateFile(file);
        if (!validation.valid) {
          console.error(validation.error);
          return;
        }

        const fileId = generateId();
        const previewUrl = URL.createObjectURL(file);

        const newFile: FileAttachment = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type,
          status: "pending",
          progress: 0,
          file: file,
          previewUrl: previewUrl,
        };

        if (!(window as any).__pendingFiles) {
          (window as any).__pendingFiles = {};
        }
        (window as any).__pendingFiles[fileId] = file;

        set((state) => ({
          uploadingFiles: [...state.uploadingFiles, newFile],
        }));
      },

      updateFileProgress: (fileId: string, progress: number) => {
        set((state) => ({
          uploadingFiles: state.uploadingFiles.map((f) =>
            f.id === fileId ? { ...f, progress } : f,
          ),
        }));
      },

      updateFileStatus: (
        fileId: string,
        status: FileAttachment["status"],
        error?: string,
      ) => {
        set((state) => ({
          uploadingFiles: state.uploadingFiles.map((f) =>
            f.id === fileId ? { ...f, status, error } : f,
          ),
        }));
      },

      updateFileExtractedText: (fileId: string, text: string) => {
        set((state) => ({
          uploadingFiles: state.uploadingFiles.map((f) =>
            f.id === fileId ? { ...f, extractedText: text } : f,
          ),
        }));
      },

      removeFile: (fileId: string) => {
        const fileToRemove = get().uploadingFiles.find((f) => f.id === fileId);

        if (fileToRemove?.previewUrl) {
          URL.revokeObjectURL(fileToRemove.previewUrl);
        }

        if ((window as any).__pendingFiles) {
          delete (window as any).__pendingFiles[fileId];
        }

        set((state) => ({
          uploadingFiles: state.uploadingFiles.filter((f) => f.id !== fileId),
        }));
      },

      clearFiles: () => {
        if ((window as any).__pendingFiles) {
          (window as any).__pendingFiles = {};
        }
        set({ uploadingFiles: [] });
      },

      processFile: async (fileId: string) => {
        const fileEntry = get().uploadingFiles.find((f) => f.id === fileId);
        if (!fileEntry) return;

        const file = (window as any).__pendingFiles?.[fileId];
        if (!file) {
          console.error("❌ Файл не найден:", fileId);
          get().updateFileStatus(fileId, "error", "Файл не найден");
          return;
        }

        get().updateFileStatus(fileId, "processing");

        try {
          const text = await apiClient.ocrFile(file, (progress) =>
            get().updateFileProgress(fileId, progress),
          );

          get().updateFileStatus(fileId, "completed");
          get().updateFileProgress(fileId, 100);
          get().updateFileExtractedText(fileId, text);

          if (text && text.trim()) {
            await get().smartChatStream(text.trim());

            setTimeout(() => {
              const currentFiles = get().uploadingFiles;
              const fileExists = currentFiles.some((f) => f.id === fileId);

              if (fileExists) {
                get().removeFile(fileId);
              }
            }, 1000);
          } else {
            get().updateFileStatus(
              fileId,
              "error",
              "Текст не найден на изображении",
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Ошибка обработки файла";
          get().updateFileStatus(fileId, "error", errorMessage);
        } finally {
          delete (window as any).__pendingFiles?.[fileId];
        }
      },

      retryFile: async (fileId: string) => {
        const fileEntry = get().uploadingFiles.find((f) => f.id === fileId);
        if (!fileEntry || fileEntry.status !== "error") return;

        get().updateFileStatus(fileId, "uploading");
        get().updateFileProgress(fileId, 0);
        await get().processFile(fileId);
      },

      uploadPendingFiles: async () => {
        const { uploadingFiles } = get();
        const pendingFiles = uploadingFiles.filter(
          (f) => f.status === "pending",
        );

        if (pendingFiles.length === 0) {
          return;
        }

        const file = pendingFiles[0];
        await get().processFile(file.id);
      },
    }),
    { name: "chat-store" },
  ),
);