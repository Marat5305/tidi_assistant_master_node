import type { LucideIcon } from 'lucide-react';

export interface Conversation {
  id: string;
  rag_id?: string;
  /** legacy-поле; бэкенд отдаёт `title` */
  name?: string;
  /** реальное поле бэкенда */
  title?: string;
  model?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  threadId: string;
  conversation_id: string;
  timestamp: number;
  created_at?: string;
  status: 'sent' | 'error' | 'pending';
  citations?: Citation[];
  /** legacy, Chat Completions */
  completion_id?: string;
  /** Responses API: resp_... */
  response_id?: string;
}

export interface Citation {
  id: string;
  number: number;
  title?: string;
  snippet?: string;
  url?: string;
  source?: string;
  text?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  file?: File;
  fileId?: string;
  previewUrl?: string;
  extractedText?: string;
  error?: string;
  url?: string;
}

export interface SuggestionAction {
  id: string;
  label: string;
  prompt: string;
  icon?: LucideIcon;
}

export interface VirtualScrollData {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
}

export interface ModelsConversationsEntry {
  model_name: string;
  model: string;
  conversations: Conversation[];
}

export interface ChatState {
  model: string | null;
  conversations: Conversation[];
  currentConversation_id: string | null;
  messages: Message[];
  isStreaming: boolean;
  streamingMessage: string;
  activeCitations: Citation[];
  showCitationsPanel: boolean;
  error: string | null;
  isLoading: boolean;
  isMasterMode: boolean;
  uploadingFiles: FileAttachment[];
  models_list: ModelsConversationsEntry[];
  abortController: AbortController | null;
   availableRags: { id: string; name: string }[];
  /** legacy */
  completionId: string | null;
  /** Responses API */
  responseId: string | null;
}

export interface ChatActions {
  setModel: (model: string | null) => void;
  createConversation: () => Promise<string | undefined>;
  loadConversations: () => Promise<void>;
  setActiveConversation: (conversation_id: string) => Promise<void>;
  renameConversation: (conversation_id: string, name: string) => Promise<void>;
  deleteConversation: (conversation_id: string) => Promise<void>;
  loadConversationMessages: (
    conversation_id: string,
    modelOverride?: string,
  ) => Promise<void>;

  addMessage: (message: Message) => void;
  appendToStreamingMessage: (chunk: string) => void;
  finalizeStreamingMessage: (finalMessage: Message) => void;
  setIsLoading: (isLoading: boolean) => void;

  sendMessage: (text: string) => Promise<void>;
  sendMessageStream: (
    text: string,
    onChunk?: (chunk: string) => void,
  ) => Promise<void>;

  smartChat: (text: string, context?: any) => Promise<void>;
  smartChatStream: (
    text: string,
    onChunk?: (chunk: string) => void,
  ) => Promise<void>;
  stopStreaming: () => void;

  clearMessages: () => void;

  setFeedback: (messageId: string, vote: number, comment?: string) => Promise<void>;
  getFeedback: (messageId: string) => Promise<any | null>;
  deleteFeedback: (messageId: string) => Promise<void>;

  setCitations: (citations: Citation[]) => void;
  toggleCitationsPanel: () => void;

  setStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  setMasterMode: (enabled: boolean) => void;

  addFile: (file: File) => Promise<void>;
  updateFileProgress: (fileId: string, progress: number) => void;
  updateFileStatus: (
    fileId: string,
    status: FileAttachment['status'],
    error?: string,
  ) => void;
  updateFileExtractedText: (fileId: string, text: string) => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  processFile: (fileId: string) => Promise<void>;
  retryFile: (fileId: string) => Promise<void>;
  uploadPendingFiles: () => Promise<void>;
  createRAG: (
    name: string,
    description: string | null,
    files?: File[],
  ) => Promise<
    | { ok: true; ragId: string; documents: unknown }
    | { ok: false; error: string }
  >;
  loadAvailableRags: () => Promise<void>;
}

export interface AllModelsConversations {
  models_list: ModelsConversationsEntry[];
  getAllModelsConversations: () => Promise<ModelsConversationsEntry[]>;
}

export interface ChatResponse {
  message_id: string;
  content: string;
  conversation_id: string;
  created_at?: string;
}

export interface ApiMessage {
  id: string;
  object?: string;
  conversation_id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  status?: string;
  error?: string | null;
  created_at?: string;
}

export interface PaginatedMessages {
  data: ApiMessage[];
  has_more: boolean;
}

export type ConversationMessagesResponse = ApiMessage[] | PaginatedMessages;

/** Сырые события Responses API (SSE) — для типизации. */
export type ResponsesSSEEvent =
  | { type?: 'response.created'; sequence_number?: number; response?: any; id?: string; model?: string; conversation_id?: string }
  | { type?: 'response.in_progress'; sequence_number?: number; response?: any; id?: string }
  | { type?: 'response.output_item.added'; sequence_number?: number; output_index?: number; item: any }
  | { type?: 'response.content_part.added'; sequence_number?: number; item_id?: string; output_index?: number; content_index?: number; part: any }
  | { type?: 'response.output_text.delta'; sequence_number?: number; item_id?: string; output_index?: number; content_index?: number; delta: string; id?: string }
  | { type?: 'response.output_text.done'; sequence_number?: number; item_id?: string; output_index?: number; content_index?: number; text: string; id?: string }
  | { type?: 'response.content_part.done'; sequence_number?: number; item_id?: string; output_index?: number; content_index?: number; part: any; id?: string }
  | { type?: 'response.output_item.done'; sequence_number?: number; output_index?: number; item: any; id?: string }
  | { type?: 'response.completed'; sequence_number?: number; response?: any; id?: string; status?: string; model?: string; usage?: any }
  | { type?: 'error'; sequence_number?: number; message?: string; code?: string };