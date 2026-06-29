// src/components/chat/MessageList.tsx
import { useState } from 'react';
import { MessageItem } from './MessageItem';
import { MessageFeedback } from './MessageFeedback';
import { SuggestionButtons } from './SuggestionButtons';
import { CitationsPanel } from './CitationsPanel';
import { useChatStore } from '../../store/chatStore';
import { type SuggestionAction } from '../../types/chat';

interface MessageListProps {
  bottomRef: React.RefObject<HTMLDivElement | null>;  // ref будет приходить из ChatContainer
}

// Компонент принимает проп bottomRef
export function MessageList({ bottomRef }: MessageListProps) {
  const { messages, isMasterMode, smartChatStream, isStreaming } = useChatStore();
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

  // useEffect(() => {
  //   if (messages && messages.length != 0) {
  //     if (import.meta.env.DEV) {
  //       console.log(messages);
  //     }
  //   }
  //   else {
  //     if (import.meta.env.DEV) {
  //       console.log('Messages is null or its empty');
  //     }
  //   }
  // }, [messages])

  // Обработчик клика по подсказке
  const handleSuggestionClick = (prompt: string) => {
    // const { sendMessage, isStreaming } = useChatStore.getState();
    if (isStreaming) return;
    // sendMessage(prompt);
    // sendMessageStream(prompt);
    smartChatStream(prompt)
  };

  return (
    <div id="message-list-container" className="flex-1 overflow-y-auto py-4 px-6 space-y-3 relative">
      {messages.map((message) => (
        <div key={message.id}>
          <MessageItem
            message={message}
            activeCitationId={activeCitationId}
            onCitationClick={setActiveCitationId}
          />
          {!isMasterMode && message.role === 'assistant' && (
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
      {/* bottomRef приходит извне */}
      <div ref={bottomRef} />
    </div>
  );
}