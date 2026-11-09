import type { LucideIcon } from 'lucide-react';

export interface Conversation {
  id: string;
  rag_id: string;
  name?: string;
  model: string;
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
  completion_id?: string;
}

export interface Citation {
  id: string;          // обязательный — используется как key/data-attr/аргумент
  number: number;      // порядковый номер для бейджа
  title?: string;      // заголовок источника
  snippet?: string;    // краткий текст / выдержка
  url?: string;        // ссылка
  source?: string;     // (опционально) исходное поле с бэка
  text?: string;       // (опционально) полный текст
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  file?: File;
  fileId?: string;          // <-- id из uploadFile (file-85b365de-...)
  previewUrl?: string;
  extractedText?: string;
  error?: string;
  url?: string;             // оставьте, если где-то ещё используется
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
  completionId: string | null;
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
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
}