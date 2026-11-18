/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient, resolveAgentIdForSources } from '../services/api';
import type {
  Message, Citation, ChatState, ChatActions, AllModelsConversations, FileAttachment,
} from '../types/chat';
import { generateId } from '../utils/id';
import { validateFile } from '../config/ocr';
import { mergeCitations } from '../utils/citations';

type ChatStore = ChatState & ChatActions & AllModelsConversations;

const WELCOME_MESSAGE: Message = {
  id: 'welcome', role: 'assistant', content: 'Привет! Задай вопрос или загрузи файл.',
  threadId: '', conversation_id: '', timestamp: Date.now(), created_at: new Date().toISOString(), status: 'sent',
};

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
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
      completionId: null,
      responseId: null,
      availableRags: [], // Инициализация RAG-наборов

      // === RAG ===
      loadAvailableRags: async () => {
        if (get().availableRags.length > 0) return; // Уже загружены
        try {
          const rags = await apiClient.listRags();
          set({ availableRags: rags });
        } catch (error) {
          console.error('❌ Ошибка загрузки RAG-наборов:', error);
        }
      },

      // === Управление моделью ===
      setModel: (model) => {
        const previousModel = get().model;
        if (!model) {
          set({ model: null, currentConversation_id: null, conversations: [], messages: [WELCOME_MESSAGE] });
          return;
        }
        set({ model });
        if (model !== previousModel) get().loadConversations();
      },

      createConversation: async () => {
        const { model } = get();
        if (!model) return;

        const isRag = model.startsWith('rag/');
        const agentId = isRag ? 'agentic_rag' : model;
        const ragId = isRag ? model.slice(4) : undefined;

        set({ isLoading: true, error: null });
        try {
          const conversation = await apiClient.createConversation(agentId, {
            title: 'Новый чат', rag_id: ragId,
          });
          set((state) => ({
            conversations: [conversation, ...state.conversations],
            currentConversation_id: conversation.id,
            messages: [WELCOME_MESSAGE], isLoading: false, isMasterMode: false,
          }));
          return conversation.id;
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Ошибка создания беседы';
          set({ error: msg, isLoading: false });
          throw error;
        }
      },

      loadConversations: async () => {
        const { model, isLoading } = get();
        if (isLoading || !model) return;

        const agentId = model.startsWith('rag/') ? 'agentic_rag' : model;
        set({ isLoading: true, error: null });
        try {
          const conversations = await apiClient.listConversations(agentId);
          set({ conversations, isLoading: false });
          if (conversations.length > 0 && !get().currentConversation_id) {
            await get().setActiveConversation(conversations[0].id);
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Ошибка загрузки', isLoading: false });
        }
      },

      getAllModelsConversations: async () => {
        set({ isLoading: true, error: null });
        try {
          const list = await apiClient.allModelsConversations();
          set({ models_list: list, isLoading: false });
          return list;
        } catch (error) {
          set({ error: 'Ошибка загрузки', isLoading: false });
          throw error;
        }
      },

      setActiveConversation: async (conversation_id) => {
        const { conversations, model, models_list } = get();
        let conversation = conversations.find((c) => c.id === conversation_id);
        let foundModel = model;

        if (!conversation && Array.isArray(models_list)) {
          for (const entry of models_list) {
            const found = entry.conversations?.find((c) => c.id === conversation_id);
            if (found) {
              conversation = found;
              // Если нашли в agentic_rag, восстанавливаем виртуальный model = rag/uuid
              foundModel = (entry.model === 'agentic_rag' && found.rag_id) ? `rag/${found.rag_id}` : entry.model;
              break;
            }
          }
        }

        if (!conversation) { set({ error: 'Беседа не найдена' }); return; }

        if (foundModel && foundModel !== model) {
          set({ model: foundModel, currentConversation_id: conversation_id, activeCitations: [], showCitationsPanel: false, error: null });
          await get().loadConversations();
          await get().loadConversationMessages(conversation_id, foundModel);
          return;
        }
        set({ currentConversation_id: conversation_id, activeCitations: [], showCitationsPanel: false, error: null });
        if (model) await get().loadConversationMessages(conversation_id);
      },

      renameConversation: async (conversation_id, name) => {
        const { model } = get();
        if (!model) return;
        const agentId = model.startsWith('rag/') ? 'agentic_rag' : model;
        set({ isLoading: true, error: null });
        try {
          const updated = await apiClient.renameConversation(agentId, conversation_id, name);
          set((state) => ({ conversations: state.conversations.map((c) => (c.id === conversation_id ? updated : c)), isLoading: false }));
        } catch (error) {
          set({ error: 'Ошибка переименования', isLoading: false });
        }
      },

      deleteConversation: async (conversation_id) => {
        const { model } = get();
        if (!model) return;
        const agentId = model.startsWith('rag/') ? 'agentic_rag' : model;
        set({ isLoading: true, error: null });
        try {
          await apiClient.deleteConversation(agentId, conversation_id);
          set((state) => {
            const filtered = state.conversations.filter((c) => c.id !== conversation_id);
            const isActive = state.currentConversation_id === conversation_id;
            return {
              conversations: filtered,
              currentConversation_id: isActive && filtered.length > 0 ? filtered[0].id : isActive ? null : state.currentConversation_id,
              messages: isActive ? [WELCOME_MESSAGE] : state.messages,
              isLoading: false, isMasterMode: isActive ? true : state.isMasterMode,
            };
          });
          if (get().currentConversation_id && model) await get().loadConversationMessages(get().currentConversation_id!);
        } catch (error) {
          set({ error: 'Ошибка удаления', isLoading: false });
        }
      },

      loadConversationMessages: async (conversation_id, modelOverride) => {
        const { model } = get();
        const targetModel = modelOverride || model;
        if (!targetModel) return;
        const agentId = targetModel.startsWith('rag/') ? 'agentic_rag' : targetModel;

        set({ isLoading: true, error: null });
        try {
          const raw = await apiClient.getConversationMessages(agentId, conversation_id);
          const list = Array.isArray(raw) ? raw : Array.isArray((raw as any)?.data) ? (raw as any).data : [];
          const chronological = [...list].reverse();
          const formatted: Message[] = chronological.map((m: any) => ({
            id: m.id, role: m.role, content: m.content ?? '', threadId: conversation_id, conversation_id,
            timestamp: m.created_at ? Date.parse(m.created_at) : Date.now(), created_at: m.created_at || new Date().toISOString(),
            status: m.error ? 'error' : 'sent',
          }));
          set({ messages: formatted.length > 0 ? formatted : [WELCOME_MESSAGE], isLoading: false });
        } catch (error) {
          set({ error: 'Ошибка загрузки сообщений', isLoading: false });
        }
      },

      // === Smart Chat ===
      smartChatStream: async (text, onChunk) => {
        const { model, currentConversation_id } = get();
        if (get().abortController) get().abortController?.abort();
        const abortController = new AbortController();

        set({ isLoading: true, error: null, isStreaming: true, streamingMessage: '', abortController, responseId: null });

        const userMessage: Message = {
          id: generateId(), role: 'user', content: text, threadId: currentConversation_id || 'smart-chat',
          conversation_id: currentConversation_id || 'smart-chat', timestamp: Date.now(), created_at: new Date().toISOString(), status: 'sent',
        };
        set((state) => ({ messages: [...state.messages, userMessage] }));

        let fullContent = '';
        let responseId: string | null = null;
        let citations: Citation[] = [];

        const finalizeAssistant = (content: string): Message => {
          const { currentConversation_id: cid } = get();
          const assistantMessage: Message = {
            id: generateId(), role: 'assistant', content, threadId: cid || 'smart-chat', conversation_id: cid || 'smart-chat',
            response_id: responseId ?? undefined, citations: citations.length > 0 ? citations : undefined,
            timestamp: Date.now(), created_at: new Date().toISOString(), status: 'sent',
          };
          set((state) => ({ messages: [...state.messages, assistantMessage], streamingMessage: '', isStreaming: false, isLoading: false }));
          return assistantMessage;
        };

        try {
          const generator = apiClient.smartChatStream(text, model || undefined, currentConversation_id || undefined, undefined, abortController.signal);
          for await (const chunk of generator) {
            if (chunk.response_id && chunk.response_id !== responseId) { responseId = chunk.response_id; set({ responseId }); }
            if (chunk.model || chunk.conversation_id) {
              const updates: Partial<ChatState> = {};
              if (chunk.model) updates.model = chunk.model;
              if (chunk.conversation_id) updates.currentConversation_id = chunk.conversation_id;
              updates.isMasterMode = false;
              set(updates);
              if (chunk.conversation_id) try { await get().loadConversations(); } catch {}
            }
            if (chunk.citations && chunk.citations.length > 0) { citations = mergeCitations(citations, chunk.citations); set({ activeCitations: citations }); }
            if (chunk.token) { fullContent += chunk.token; set({ streamingMessage: fullContent }); onChunk?.(chunk.token); }
            if (chunk.done) break;
          }

          if (abortController.signal.aborted) { if (fullContent) finalizeAssistant(fullContent); else set({ isStreaming: false, isLoading: false }); return; }
          if (!fullContent) throw new Error('Пустой ответ');

          const assistantMsg = finalizeAssistant(fullContent);

          if (citations.length === 0 && responseId) {
            const agentIdForSources = resolveAgentIdForSources(get().model);
            if (agentIdForSources) {
              try {
                const sources = await apiClient.getCompletionSources(agentIdForSources, responseId);
                if (sources.length > 0) set((state) => ({ activeCitations: sources, messages: state.messages.map((m) => m.id === assistantMsg.id ? { ...m, citations: sources } : m) }));
              } catch {}
            }
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : 'Ошибка';
          const isAbort = error instanceof Error && error.name === 'AbortError';
          if (fullContent) { finalizeAssistant(!isAbort ? fullContent + '\n\n⚠️ Соединение прервано.' : fullContent); return; }
          if (isAbort) { set({ isStreaming: false, isLoading: false }); return; }
          set({ streamingMessage: '', isStreaming: false, isLoading: false, error: msg });
          set((state) => ({ messages: [...state.messages, { id: generateId(), role: 'assistant', content: `❌ ${msg}`, threadId: currentConversation_id || '', conversation_id: currentConversation_id || '', timestamp: Date.now(), status: 'error' }] }));
        } finally {
          if (get().isStreaming) set({ isStreaming: false, isLoading: false, streamingMessage: '' });
          if (get().abortController === abortController) set({ abortController: null });
        }
      },

      stopStreaming: () => {
        get().abortController?.abort();
        set({ isStreaming: false, isLoading: false, streamingMessage: '', abortController: null });
      },

      clearMessages: () => set({ messages: [WELCOME_MESSAGE], streamingMessage: '', error: null, activeCitations: [] }),

      // === Обратная связь ===
      setFeedback: async (messageId, vote, comment) => {
        const agentId = resolveAgentIdForSources(get().model);
        if (!agentId) return;
        set({ isLoading: true });
        try { await apiClient.setFeedback(agentId, messageId, vote, comment); set({ isLoading: false }); } catch (e) { set({ error: 'Ошибка', isLoading: false }); }
      },
      getFeedback: async (messageId) => {
        const agentId = resolveAgentIdForSources(get().model);
        if (!agentId) return null;
        try { return await apiClient.getFeedback(agentId, messageId); } catch { return null; }
      },
      deleteFeedback: async (messageId) => {
        const agentId = resolveAgentIdForSources(get().model);
        if (!agentId) return;
        try { await apiClient.deleteFeedback(agentId, messageId); } catch {}
      },

      // === Цитаты ===
      setCitations: (citations) => { citations.forEach((c) => set((state) => ({ activeCitations: [...state.activeCitations, c] }))); },
      toggleCitationsPanel: () => set((state) => ({ showCitationsPanel: !state.showCitationsPanel })),

      // === Прочее ===
      setStreaming: (isStreaming) => set({ isStreaming }),
      setError: (error) => set({ error }),
      setMasterMode: (enabled) => set({ isMasterMode: enabled }),
      
      // Заглушки для остальных методов, чтобы TypeScript не ругался
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      appendToStreamingMessage: (chunk) => set((state) => ({ streamingMessage: state.streamingMessage + chunk })),
      finalizeStreamingMessage: (msg) => set((state) => ({ messages: [...state.messages, msg], streamingMessage: '', isStreaming: false })),
      setIsLoading: (isLoading) => set({ isLoading }),
      sendMessage: async () => {},
      sendMessageStream: async () => {},
      smartChat: async () => {},
      addFile: async () => {},
      updateFileProgress: () => {},
      updateFileStatus: () => {},
      updateFileExtractedText: () => {},
      removeFile: () => {},
      clearFiles: () => {},
      processFile: async () => {},
      retryFile: async () => {},
      uploadPendingFiles: async () => {},
      createRAG: async () => ({ ok: false, error: 'Not implemented' }),
    }),
    { name: 'chat-store' },
  ),
);