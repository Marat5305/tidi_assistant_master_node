/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types/chat.ts
// export interface Citation {
//   id: string;
//   text: string;
//   source: string;
//   page?: number;
//   url?: string;
//   relevanceScore: number;
// }

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  status: 'uploading' | 'uploaded' | 'error';
  progress: number;
}

export interface Citation {
  id: string;
  number: number;
  title: string;
  url?: string;
  snippet: string;
}

export interface Message {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  attachments?: FileAttachment[];
  timestamp: number;
  status: 'sending' | 'sent' | 'streaming' | 'error';
  tokenCount?: number;
  sessionId: string;
  created_at: string;
  suggestions?: SuggestionAction[];
}

export interface Thread {
  id: string;
  title: string;
  lastMessage?: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  contextTokens?: number;
}

export interface StreamChunk {
  type: 'text' | 'citation' | 'error' | 'done' | 'metadata';
  content?: string;
  citation?: Citation;
  error?: string;
  metadata?: {
    tokensUsed?: number;
    model?: string;
    threadId?: string;
  };
}

export interface ChatRequest {
  threadId: string;
  message: string;
  attachments?: File[];
  contextMessages?: Array<{ role: Message['role']; content: string }>;
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}

export interface VirtualScrollData {
  startIndex: number;
  endIndex: number;
  totalHeight: number;
  offsetY: number;
}

export interface StreamParserResult {
  chunks: StreamChunk[];
  remainingBuffer: string;
}

// Тип для кнопки-подсказки
export interface SuggestionAction {
  id: string;
  label: string;      // Текст на кнопке, например "Разверни подробнее"
  prompt: string;     // Что отправить при клике, например "Разверни, пожалуйста, подробнее этот ответ"
}

// Дополнительные типы для нового API
export interface Session {
  id: string;
  // name?: string;
  title: string,
  // agent_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface ChatState {
  // Состояние для нового API
  agentId: string | null;
  sessions: Session[];
  currentSessionId: string | null;
  firstRequest: boolean;
  
  // Состояние чата
  messages: Message[];
  isStreaming: boolean;
  streamingMessage: string;
  activeCitations: Citation[];
  showCitationsPanel: boolean;
  error: string | null;
  
  // UI состояние
  isLoading: boolean;
  isMasterMode: boolean;
}

export interface ChatActions {
  // Управление агентом и сессиями
  setAgentId: (agentId: string) => void;
  createSession: () => Promise<string>;
  loadSessions: () => Promise<void>;
  setActiveSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, name: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Работа с сообщениями
  loadSessionMessages: (sessionId: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  sendMessageStream: (text: string, onChunk?: (chunk: string) => void) => Promise<void>;
  clearMessages: () => void;
  // Smart Chat методы
  smartChat: (text: string, context?: any) => Promise<void>;
  smartChatStream: (text: string, onChunk?: (chunk: string) => void) => Promise<void>;
  
  // Обратная связь
  // setFeedback: (messageId: string, rating: 'positive' | 'negative', comment?: string) => Promise<void>;
  setFeedback: (messageId: string, vote: number, comment?: string) => Promise<void>;
  getFeedback: (messageId: string) => Promise<any>;
  deleteFeedback: (messageId: string) => Promise<void>;
  
  // Управление цитатами
  setCitations: (citations: Citation[]) => void;
  toggleCitationsPanel: () => void;
  
  // Управление состоянием
  setStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  setMasterMode: (enabled: boolean) => void;
}