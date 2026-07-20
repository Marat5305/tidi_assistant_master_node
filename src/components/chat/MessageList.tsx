/* eslint-disable react-hooks/purity */
// src/components/chat/MessageList.tsx
import { useState } from 'react';
import { MessageItem } from './MessageItem';
import { MessageFeedback } from './MessageFeedback';
import { SuggestionButtons } from './SuggestionButtons';
import { CitationsPanel } from './CitationsPanel';
import { useChatStore } from '../../store/chatStore';
import { type SuggestionAction, type Message } from '../../types/chat';

interface MessageListProps {
  bottomRef: React.RefObject<HTMLDivElement | null>;
}

export function MessageList({ bottomRef }: MessageListProps) {
  const { messages, isMasterMode, smartChatStream, isStreaming, streamingMessage } = useChatStore();
  const [activeCitationId, setActiveCitationId] = useState<string | null>(null);

  // Функция, возвращающая статичные подсказки для всех ассистентов
  const getDefaultSuggestions = (): SuggestionAction[] => {
    return [
      {
        id: 'suggestion-1',
        label: 'Разверни подробнее',
        prompt: 'Разверни, пожалуйста, этот ответ подробнее',
      },
      {
        id: 'suggestion-2',
        label: 'Сделай кратко',
        prompt: 'Можешь дать краткую выжимку этого ответа?',
      },
      {
        id: 'suggestion-3',
        label: 'Что ещё ты умеешь?',
        prompt: 'Расскажи, что ещё ты умеешь? Какие у тебя возможности?',
      },
    ];
  };

  // Обработчик клика по подсказке
  const handleSuggestionClick = (prompt: string) => {
    if (isStreaming) return;
    smartChatStream(prompt);
  };

  // ========== 🔧 ИСПРАВЛЕНИЕ ==========
  // Создаём временное стриминговое сообщение для отображения
  const streamingMessageObj: Message | null = isStreaming && streamingMessage
    ? {
        id: 'streaming-temp',
        role: 'assistant',
        content: streamingMessage,
        threadId: '',
        sessionId: '',
        timestamp: Date.now(),
        created_at: new Date().toISOString(),
        status: 'streaming' as const
      }
    : null;

  // Объединяем обычные сообщения со стриминговым
  const allMessages = streamingMessageObj 
    ? [...messages, streamingMessageObj] 
    : messages;
  // ===================================

  return (
    <div id="message-list-container" className="flex-1 overflow-y-auto py-4 px-6 space-y-3 relative">
      {allMessages.map((message) => (
        <div key={message.id}>
          <MessageItem
            message={message}
            activeCitationId={activeCitationId}
            onCitationClick={setActiveCitationId}
          />
          {/* Показываем подсказки и фидбек только для завершённых сообщений ассистента */}
          {!isMasterMode && 
           message.role === 'assistant' && 
           message.status !== 'streaming' && ( // 👈 Не показываем для стримингового сообщения
            <>
              <SuggestionButtons
                suggestions={getDefaultSuggestions()}
                onSuggestionClick={handleSuggestionClick}
              />
              <MessageFeedback
                messageId={message.id}
                messageContent={message.content}
              />
              {message.citations && message.citations.length > 0 && (
                <CitationsPanel
                  citations={message.citations}
                  activeCitationId={activeCitationId}
                  onCitationClick={setActiveCitationId}
                />
              )}
            </>
          )}
        </div>
      ))}
      
      {/* Индикатор набора текста (когда стриминг начался, но токенов ещё нет) */}
      {isStreaming && !streamingMessage && (
        <div className="flex items-center space-x-2 py-4 px-6">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
      
      {/* Якорь для скролла */}
      <div ref={bottomRef} />
    </div>
  );
}