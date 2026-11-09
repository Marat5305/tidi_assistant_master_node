/* eslint-disable react-hooks/purity */
// src/components/chat/MessageList.tsx
import { useState } from 'react';
import { MessageItem } from './MessageItem';
import { MessageFeedback } from './MessageFeedback';
import { SuggestionButtons } from './SuggestionButtons';
import { CitationsPanel } from './CitationsPanel';
import { useChatStore } from '../../store/chatStore';
import { type Message } from '../../types/chat';

interface MessageListProps {
  bottomRef: React.RefObject<HTMLDivElement | null>;
}

const DEFAULT_SUGGESTIONS = [
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

export function MessageList({ bottomRef }: MessageListProps) {
  const messages = useChatStore((s) => s.messages);
  const isMasterMode = useChatStore((s) => s.isMasterMode);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const streamingMessage = useChatStore((s) => s.streamingMessage);
  const smartChatStream = useChatStore((s) => s.smartChatStream);
  const currentConversationId = useChatStore(
    (s) => s.currentConversation_id,
  );

  const [activeCitationId, setActiveCitationId] = useState<string | null>(null);

  const handleSuggestionClick = (prompt: string) => {
    if (isStreaming) return;
    smartChatStream(prompt);
  };

  // Временное стриминговое сообщение
  const streamingMessageObj: Message | null =
    isStreaming && streamingMessage
      ? {
          id: 'streaming-temp',
          role: 'assistant',
          content: streamingMessage,
          threadId: currentConversationId ?? '',
          conversation_id: currentConversationId ?? '',
          timestamp: Date.now(),
          created_at: new Date().toISOString(),
          status: 'pending',
        }
      : null;

  const allMessages: Message[] = streamingMessageObj
    ? [...messages, streamingMessageObj]
    : messages;

  return (
    <div
      id="message-list-container"
      className="flex-1 overflow-y-auto py-4 px-6 space-y-3 relative"
    >
      {allMessages.map((message) => {
        const isStreamingMsg = message.id === 'streaming-temp';
        const citations = message.citations;

        return (
          <div key={message.id}>
            <MessageItem
              message={message}
              activeCitationId={activeCitationId}
              onCitationClick={setActiveCitationId}
            />

            {!isMasterMode &&
              message.role === 'assistant' &&
              !isStreamingMsg && (
                <>
                  <SuggestionButtons
                    suggestions={DEFAULT_SUGGESTIONS}
                    onSuggestionClick={handleSuggestionClick}
                  />

                  {/* Фидбек доступен только если есть completion_id */}
                  {message.completion_id && (
                    <MessageFeedback
                      completionId={message.completion_id}
                      messageContent={message.content}
                    />
                  )}

                  {citations && citations.length > 0 && (
                    <CitationsPanel
                      citations={citations}
                      activeCitationId={activeCitationId}
                      onCitationClick={setActiveCitationId}
                    />
                  )}
                </>
              )}
          </div>
        );
      })}

      {/* Индикатор набора: стриминг начался, но токенов ещё нет */}
      {isStreaming && !streamingMessage && (
        <div className="flex items-center space-x-2 py-4 px-6">
          <div className="flex space-x-1">
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}