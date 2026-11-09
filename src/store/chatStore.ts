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
  AllModelsConversations,
  FileAttachment,
} from '../types/chat';
import { generateId } from '../utils/id';
import { validateFile } from '../config/ocr';

type ChatStore = ChatState & ChatActions & AllModelsConversations;

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Привет! Я твой AI-помощник. Задай вопрос или загрузи файл.',
  threadId: '',
  conversation_id: '',
  timestamp: Date.now(),
  created_at: new Date().toISOString(),
  status: 'sent',
};

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      // === Начальное состояние ===
      model: null,
      conversations: [],
      currentConversation_id: null,
      messages: [WELCOME_MESSAGE],
      isStreaming: false,
      streamingMessage: '',
      activeCitations: [],
      showCitationsPanel: true,
      error: null,
      isLoading: false,
      isMasterMode: false,
      uploadingFiles: [],
      models_list: [],
      abortController: null,

      // === Управление моделью и беседами ===

      setModel: (model: string | null) => {
        const previousModel = get().model;

        if (!model) {
          set({
            model: null,
            currentConversation_id: null,
            conversations: [],
            messages: [WELCOME_MESSAGE],
          });
          return;
        }

        set({ model });

        if (model !== previousModel) {
          get().loadConversations();
        }
      },

      createConversation: async () => {
        const { model } = get();
        if (!model) {
          console.warn('❌ Model не установлен');
          return;
        }
        set({ isLoading: true, error: null });
        try {
          const conversation = await apiClient.createConversation(model);
          set((state) => ({
            conversations: [conversation, ...state.conversations],
            currentConversation_id: conversation.id,
            messages: [WELCOME_MESSAGE],
            isLoading: false,
            isMasterMode: false,
          }));
          return conversation.id;
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : 'Ошибка создания беседы';
          set({ error: msg, isLoading: false });
          throw error;
        }
      },

      loadConversations: async () => {
        const { model, isLoading } = get();
        if (isLoading) return;
        if (!model) return;

        set({ isLoading: true, error: null });
        try {
          const conversations = await apiClient.listConversations(model);
          set({ conversations, isLoading: false });

          if (conversations.length > 0 && !get().currentConversation_id) {
            await get().setActiveConversation(conversations[0].id);
          }
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : 'Ошибка загрузки бесед';
          set({ error: msg, isLoading: false });
        }
      },

      getAllModelsConversations: async () => {
        set({ isLoading: true, error: null });
        try {
          const list = await apiClient.allModelsConversations();
          set({ models_list: list, isLoading: false });
          return list;
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : 'Ошибка загрузки бесед';
          set({ error: msg, isLoading: false });
          throw error;
        }
      },

      setActiveConversation: async (conversation_id: string) => {
        const { conversations, model, models_list } = get();

        let conversation = conversations.find((c) => c.id === conversation_id);
        let foundModel = model;

        if (!conversation && Array.isArray(models_list)) {
          for (const entry of models_list) {
            const found = entry.conversations?.find(
              (c) => c.id === conversation_id,
            );
            if (found) {
              conversation = found;
              foundModel = entry.model;
              break;
            }
          }
        }

        if (!conversation) {
          set({ error: 'Беседа не найдена' });
          return;
        }

        if (foundModel && foundModel !== model) {
          set({
            model: foundModel,
            currentConversation_id: conversation_id,
            activeCitations: [],
            showCitationsPanel: false,
            error: null,
            isMasterMode: false,
          });
          await get().loadConversations();
          await get().loadConversationMessages(conversation_id, foundModel);
          return;
        }

        set({
          currentConversation_id: conversation_id,
          activeCitations: [],
          showCitationsPanel: false,
          error: null,
          isMasterMode: false,
        });

        if (model) {
          await get().loadConversationMessages(conversation_id);
        }
      },

      renameConversation: async (conversation_id: string, name: string) => {
        const { model } = get();
        if (!model) return;

        set({ isLoading: true, error: null });
        try {
          const updated = await apiClient.renameConversation(
            model,
            conversation_id,
            name,
          );
          set((state) => ({
            conversations: state.conversations.map((c) =>
              c.id === conversation_id ? updated : c,
            ),
            isLoading: false,
          }));
        } catch (error) {
          const msg =
            error instanceof Error
              ? error.message
              : 'Ошибка переименования беседы';
          set({ error: msg, isLoading: false });
        }
      },

      deleteConversation: async (conversation_id: string) => {
        const { model } = get();
        if (!model) return;

        set({ isLoading: true, error: null });
        try {
          await apiClient.deleteConversation(model, conversation_id);

          set((state) => {
            const filtered = state.conversations.filter(
              (c) => c.id !== conversation_id,
            );
            const isActive = state.currentConversation_id === conversation_id;
            return {
              conversations: filtered,
              currentConversation_id:
                isActive && filtered.length > 0
                  ? filtered[0].id
                  : isActive
                    ? null
                    : state.currentConversation_id,
              messages: isActive ? [WELCOME_MESSAGE] : state.messages,
              isLoading: false,
              isMasterMode: isActive ? true : state.isMasterMode,
            };
          });

          const newState = get();
          if (newState.currentConversation_id && model) {
            await get().loadConversationMessages(
              newState.currentConversation_id,
            );
          }
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : 'Ошибка удаления беседы';
          set({ error: msg, isLoading: false });
        }
      },

      // === Сообщения ===

      loadConversationMessages: async (
        conversation_id: string,
        modelOverride?: string,
      ) => {
        const { model } = get();
        const targetModel = modelOverride || model;
        if (!targetModel) return;

        set({ isLoading: true, error: null });
        try {
          const messages = await apiClient.getConversationMessages(
            targetModel,
            conversation_id,
          );
          const formatted: Message[] = messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            threadId: m.conversation_id || conversation_id,
            conversation_id: m.conversation_id || conversation_id,
            timestamp: Date.now(),
            created_at: m.created_at || new Date().toISOString(),
            status: 'sent',
          }));

          set({
            messages: formatted.length > 0 ? formatted : [WELCOME_MESSAGE],
            isLoading: false,
          });
        } catch (error) {
          const msg =
            error instanceof Error
              ? error.message
              : 'Ошибка загрузки сообщений';
          set({ error: msg, isLoading: false });
        }
      },

      // === Стриминг helpers ===

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
        set((state) => ({
          messages: [
            ...state.messages.filter((m) => m.id !== 'streaming-temp'),
            finalMessage,
          ],
          streamingMessage: '',
          isStreaming: false,
        }));
      },

      setIsLoading: (isLoading: boolean) => set({ isLoading }),

      // === Обычный чат ===

      sendMessage: async (text: string) => {
        const { model, currentConversation_id } = get();
        if (!model || !currentConversation_id) {
          set({ error: 'Не выбрана беседа или модель' });
          return;
        }

        const userMessage: Message = {
          id: generateId(),
          role: 'user',
          content: text,
          threadId: currentConversation_id,
          conversation_id: currentConversation_id,
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
          status: 'sent',
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          isStreaming: true,
          isMasterMode: false,
          error: null,
        }));

        try {
          const response = await apiClient.chat(
            model,
            currentConversation_id,
            text,
          );
          const assistantMessage: Message = {
            id: response.message_id || generateId(),
            role: 'assistant',
            content: response.content,
            threadId: response.conversation_id || currentConversation_id,
            conversation_id:
              response.conversation_id || currentConversation_id,
            timestamp: Date.now(),
            created_at: response.created_at || new Date().toISOString(),
            status: 'sent',
          };
          set((state) => ({
            messages: [...state.messages, assistantMessage],
            isStreaming: false,
          }));
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : 'Ошибка отправки сообщения';
          const errMsg: Message = {
            id: generateId(),
            role: 'assistant',
            content: `❌ Ошибка: ${msg}`,
            threadId: currentConversation_id,
            conversation_id: currentConversation_id,
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: 'error',
          };
          set((state) => ({
            messages: [...state.messages, errMsg],
            isStreaming: false,
            error: msg,
          }));
        }
      },

      sendMessageStream: async (
        text: string,
        onChunk?: (chunk: string) => void,
      ) => {
        const { model, currentConversation_id } = get();
        if (!model || !currentConversation_id) {
          set({ error: 'Не выбрана беседа или модель' });
          return;
        }

        const userMessage: Message = {
          id: generateId(),
          role: 'user',
          content: text,
          threadId: currentConversation_id,
          conversation_id: currentConversation_id,
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
          status: 'sent',
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
          isStreaming: true,
          streamingMessage: '',
          isMasterMode: false,
          error: null,
        }));

        let fullContent = '';
        const controller = new AbortController();

        try {
          const generator = apiClient.streamChat(
            model,
            currentConversation_id,
            text,
            undefined,
            controller.signal,
          );
          for await (const chunk of generator) {
            fullContent += chunk;
            set({ streamingMessage: fullContent });
            onChunk?.(chunk);
          }
          if (!fullContent) throw new Error('Сервер вернул пустой ответ');

          const assistantMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: fullContent,
            threadId: currentConversation_id,
            conversation_id: currentConversation_id,
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: 'sent',
          };
          set((state) => ({
            messages: [...state.messages, assistantMessage],
            streamingMessage: '',
            isStreaming: false,
          }));
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : 'Ошибка стриминга';

          if (fullContent) {
            const partial: Message = {
              id: generateId(),
              role: 'assistant',
              content:
                fullContent +
                '\n\n⚠️ Соединение было прервано, но часть ответа сохранена.',
              threadId: currentConversation_id,
              conversation_id: currentConversation_id,
              timestamp: Date.now(),
              created_at: new Date().toISOString(),
              status: 'sent',
            };
            set((state) => ({
              messages: [...state.messages, partial],
              streamingMessage: '',
              isStreaming: false,
            }));
            return;
          }

          set({ streamingMessage: '', isStreaming: false, error: msg });
          const errMsg: Message = {
            id: generateId(),
            role: 'assistant',
            content: `❌ Ошибка: ${msg}`,
            threadId: currentConversation_id,
            conversation_id: currentConversation_id,
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: 'error',
          };
          set((state) => ({ messages: [...state.messages, errMsg] }));
        }
      },

      // === Smart Chat ===

      smartChat: async (text: string, _context?: any) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.chat(
            get().model ?? 'auto',
            get().currentConversation_id ?? 'smart-chat',
            text,
          );
          const userMessage: Message = {
            id: generateId(),
            role: 'user',
            content: text,
            threadId: get().currentConversation_id ?? 'smart-chat',
            conversation_id: get().currentConversation_id ?? 'smart-chat',
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: 'sent',
          };
          const assistantMessage: Message = {
            id: response.message_id || generateId(),
            role: 'assistant',
            content: response.content,
            threadId: get().currentConversation_id ?? 'smart-chat',
            conversation_id: get().currentConversation_id ?? 'smart-chat',
            timestamp: Date.now(),
            created_at: response.created_at || new Date().toISOString(),
            status: 'sent',
          };
          set((state) => ({
            messages: [...state.messages, userMessage, assistantMessage],
            isLoading: false,
          }));
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : 'Ошибка Smart Chat';
          set({ error: msg, isLoading: false });
          const errMsg: Message = {
            id: generateId(),
            role: 'assistant',
            content: `❌ Ошибка Smart Chat: ${msg}`,
            threadId: get().currentConversation_id ?? 'smart-chat',
            conversation_id: get().currentConversation_id ?? 'smart-chat',
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: 'error',
          };
          set((state) => ({ messages: [...state.messages, errMsg] }));
        }
      },

      smartChatStream: async (
        text: string,
        onChunk?: (chunk: string) => void,
      ): Promise<void> => {
        const { model, currentConversation_id, isMasterMode } = get();

        console.log('🚀 [chatStore.smartChatStream] Вызов:', {
          text: text.slice(0, 50) + (text.length > 50 ? '...' : ''),
          model: model || 'не указан',
          currentConversation_id: currentConversation_id || 'не указан',
          isMasterMode,
        });

        const prevController = get().abortController;
        if (prevController) {
          try {
            prevController.abort();
          } catch {
            /* noop */
          }
        }

        const abortController = new AbortController();

        set({
          isLoading: true,
          error: null,
          isStreaming: true,
          streamingMessage: '',
          abortController,
          completionId: null
        });

        const userMessage: Message = {
          id: generateId(),
          role: 'user',
          content: text,
          threadId: currentConversation_id || 'smart-chat',
          conversation_id: currentConversation_id || 'smart-chat',
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
          status: 'sent',
        };

        set((state) => ({
          messages: [...state.messages, userMessage],
        }));

        let fullContent = '';
        let sawDone = false;

        const finalizeAssistant = (content: string): Message => {
          const { currentConversation_id, completionId } = get();

          const assistantMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content,
            threadId: currentConversation_id || 'smart-chat',
            conversation_id: currentConversation_id || 'smart-chat',
            completion_id: completionId ?? undefined,
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: 'sent',
          };

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            streamingMessage: '',
            isStreaming: false,
            isLoading: false,
          }));

          return assistantMessage;
        };

        try {
          const apiModel = model || undefined;
          const apiConversationId = currentConversation_id || undefined;

          console.log('📤 [chatStore] Параметры для API:', {
            apiModel: apiModel || 'не передан',
            apiConversationId: apiConversationId || 'не передан',
          });

          const generator = apiClient.smartChatStream(
            text,
            apiModel,
            apiConversationId,
            undefined,
            abortController.signal,
          );

          for await (const chunk of generator) {
            // completion_id
            if (chunk.completion_id) {
              console.log('🆔 [chatStore] completion_id:', chunk.completion_id);
              set({ completionId: chunk.completion_id });
            }

            // model / conversation_id
            if (chunk.model || chunk.conversation_id) {
              const updates: Partial<ChatState> = {};
              if (chunk.model) updates.model = chunk.model;
              if (chunk.conversation_id) updates.currentConversation_id = chunk.conversation_id;
              updates.isMasterMode = false;
              set(updates);

              if (chunk.conversation_id) {
                try { await get().loadConversations(); } catch (err) {
                  console.warn('⚠️ loadConversations:', err);
                }
              }
            }

            // токен
            if (chunk.token) {
              fullContent += chunk.token;
              set({ streamingMessage: fullContent });
              onChunk?.(chunk.token);
            }

            // завершение
            if (chunk.done) {
              sawDone = true;
              break;
            }
          }

          if (abortController.signal.aborted) {
            console.log('🛑 [chatStore] Стрим отменён пользователем');
            if (fullContent) {
              finalizeAssistant(fullContent);
            } else {
              set({
                streamingMessage: '',
                isStreaming: false,
                isLoading: false,
              });
            }
            return;
          }

          console.log(
            '✅ [chatStore] Стрим завершен. Длина ответа:',
            fullContent.length,
          );

          if (!fullContent) {
            throw new Error('Smart Chat вернул пустой ответ');
          }

          if (!sawDone) {
            console.log(
              'ℹ️ [chatStore] [DONE]/finish_reason не получен, но стрим закрылся',
            );
          }

          // finalizeAssistant(fullContent);





          // финализируем сообщение и получаем его объект
          const assistantMsg = finalizeAssistant(fullContent);

          const completionId = assistantMsg.completion_id;
          const agent_id = get().model;

          if (completionId && agent_id) {
            try {
              const citations = await apiClient.getCompletionSources(agent_id, completionId);
              if (citations.length > 0) {
                set((state) => ({
                  messages: state.messages.map((m) =>
                    m.id === assistantMsg.id ? { ...m, citations } : m,
                  ),
                }));
              }
            } catch (err) {
              console.warn('⚠️ Не удалось загрузить источники:', err);
            }
          }





        } catch (error) {
          console.error('❌ [chatStore.smartChatStream] Ошибка:', error);

          const errorMessage =
            error instanceof Error ? error.message : 'Ошибка Smart Chat';

          const isAbort =
            error instanceof Error &&
            (error.name === 'AbortError' ||
              /aborted|abort/i.test(error.message));

          if (fullContent) {
            finalizeAssistant(
              !isAbort
                ? fullContent +
                '\n\n⚠️ Соединение было прервано, но часть ответа сохранена.'
                : fullContent,
            );
            return;
          }

          if (isAbort) {
            set({
              streamingMessage: '',
              isStreaming: false,
              isLoading: false,
            });
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
            threadId: currentConversation_id || 'smart-chat',
            conversation_id: currentConversation_id || 'smart-chat',
            timestamp: Date.now(),
            created_at: new Date().toISOString(),
            status: 'error',
          };

          set((state) => ({
            messages: [...state.messages, errorMessageObj],
          }));
        } finally {
          if (get().isStreaming) {
            set({
              isStreaming: false,
              isLoading: false,
              streamingMessage: '',
            });
          }
          if (get().abortController === abortController) {
            set({ abortController: null });
          }
        }
      },

      stopStreaming: () => {
        const controller = get().abortController;
        if (controller) {
          try {
            controller.abort();
          } catch {
            /* noop */
          }
        }
        set({
          isStreaming: false,
          isLoading: false,
          streamingMessage: '',
          abortController: null,
        });
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

      setFeedback: async (
        messageId: string,
        vote: number,
        comment?: string,
      ) => {
        const { model } = get();
        if (!model) {
          console.warn('ℹ️ Model не установлен, пропускаем feedback');
          return;
        }

        set({ isLoading: true, error: null });
        try {
          await apiClient.setFeedback(model, messageId, vote, comment);
          set({ isLoading: false });
        } catch (error) {
          const msg =
            error instanceof Error
              ? error.message
              : 'Ошибка отправки feedback';
          set({ error: msg, isLoading: false });
        }
      },

      getFeedback: async (messageId: string) => {
        const { model } = get();
        if (!model) {
          console.warn('ℹ️ Model не установлен, пропускаем feedback');
          return null;
        }
        try {
          return await apiClient.getFeedback(model, messageId);
        } catch (error) {
          const msg =
            error instanceof Error
              ? error.message
              : 'Ошибка получения feedback';
          set({ error: msg });
          return null;
        }
      },

      deleteFeedback: async (messageId: string) => {
        const { model } = get();
        if (!model) {
          console.warn('ℹ️ Model не установлен, пропускаем feedback');
          return;
        }

        set({ isLoading: true, error: null });
        try {
          await apiClient.deleteFeedback(model, messageId);
          set({ isLoading: false });
        } catch (error) {
          const msg =
            error instanceof Error
              ? error.message
              : 'Ошибка удаления feedback';
          set({ error: msg, isLoading: false });
        }
      },

      // === Цитаты ===

      setCitations: (citations: Citation[]) => {
        if (!citations) return;
        citations.forEach((citation) => {
          set({ activeCitations: [...get().activeCitations, citation] });
        });
      },

      toggleCitationsPanel: () => {
        set((state) => ({ showCitationsPanel: !state.showCitationsPanel }));
      },

      // === Состояние ===

      setStreaming: (isStreaming: boolean) => set({ isStreaming }),
      setError: (error: string | null) => set({ error }),
      setMasterMode: (enabled: boolean) => set({ isMasterMode: enabled }),

      // RAG
      // chatStore.tsx

      createRAG: async (
        name: string,
        description: string | null,
        files: File[] = [],
      ): Promise<
        | { ok: true; ragId: string; documents: unknown }
        | { ok: false; error: string }
      > => {
        set({ isLoading: true, error: null });

        try {
          // 1. создаём набор
          const { id: ragId } = await apiClient.createRAGSet({
            name,
            description: description ?? undefined,
          });

          // 2. заливаем файлы (если есть)
          let documents: unknown = null;
          if (files.length > 0) {
            documents = await apiClient.uploadRAGDocuments(ragId, files);
          }

          set({ isLoading: false });
          return { ok: true, ragId, documents };
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Ошибка создания RAG';
          set({ error: msg, isLoading: false });
          return { ok: false, error: msg };
        }
      },

      // === Файлы ===

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
          status: 'pending',
          progress: 0,
          file,
          previewUrl,
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
        status: FileAttachment['status'],
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
          uploadingFiles: state.uploadingFiles.filter(
            (f) => f.id !== fileId,
          ),
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
          console.error('❌ Файл не найден:', fileId);
          get().updateFileStatus(fileId, 'error', 'Файл не найден');
          return;
        }

        get().updateFileStatus(fileId, 'processing');

        try {
          const text = await apiClient.ocrFile(file, (progress) =>
            get().updateFileProgress(fileId, progress),
          );

          get().updateFileStatus(fileId, 'completed');
          get().updateFileProgress(fileId, 100);
          get().updateFileExtractedText(fileId, text);

          if (text && text.trim()) {
            await get().smartChatStream(text.trim());

            setTimeout(() => {
              const currentFiles = get().uploadingFiles;
              if (currentFiles.some((f) => f.id === fileId)) {
                get().removeFile(fileId);
              }
            }, 1000);
          } else {
            get().updateFileStatus(
              fileId,
              'error',
              'Текст не найден на изображении',
            );
          }
        } catch (error) {
          const msg =
            error instanceof Error ? error.message : 'Ошибка обработки файла';
          get().updateFileStatus(fileId, 'error', msg);
        } finally {
          delete (window as any).__pendingFiles?.[fileId];
        }
      },

      retryFile: async (fileId: string) => {
        const fileEntry = get().uploadingFiles.find((f) => f.id === fileId);
        if (!fileEntry || fileEntry.status !== 'error') return;

        get().updateFileStatus(fileId, 'uploading');
        get().updateFileProgress(fileId, 0);
        await get().processFile(fileId);
      },

      uploadPendingFiles: async () => {
        const { uploadingFiles } = get();
        const pendingFiles = uploadingFiles.filter(
          (f) => f.status === 'pending',
        );
        if (pendingFiles.length === 0) return;
        await get().processFile(pendingFiles[0].id);
      },
    }),
    { name: 'chat-store' },
  ),
);