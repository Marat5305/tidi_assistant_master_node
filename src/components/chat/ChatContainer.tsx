// src/components/chat/ChatContainer.tsx
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';
import { useChatStore } from '../../store/chatStore';
import { useRef, useEffect, useState } from 'react';
import { FileDropZone } from './FileDropZone';
import { ChevronDown } from 'lucide-react';

export function ChatContainer() {
  const messages = useChatStore((state) => state.messages);
  const isMasterMode = useChatStore((state) => state.isMasterMode);
  const isStreaming = useChatStore((state) => state.isStreaming);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    requestAnimationFrame(() => setIsReady(true));
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      const newIsNearBottom = distanceToBottom < 100;
      setIsNearBottom(newIsNearBottom);

      if (newIsNearBottom && hasNewMessages) {
        setHasNewMessages(false);
      }
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasNewMessages]);

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      if (!isNearBottom && !isMasterMode) {
        // setHasNewMessages(true);
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, isNearBottom, isMasterMode]);

  useEffect(() => {
    if (!isMasterMode && messages.length > 0 && isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMasterMode, isNearBottom]);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsNearBottom(true);
  };

  const hasRealMessages = messages.length > 1;
  const showMessages = !isMasterMode || hasRealMessages;

  useEffect(() => {
    console.log('📊 ChatContainer состояние:', {
      messagesCount: messages.length,
      isMasterMode,
      showMessages,
      messages: messages.map(m => ({ role: m.role, content: m.content?.slice(0, 30) }))
    });
  }, [messages, isMasterMode, showMessages]);

  return (
    <div
      ref={containerRef}
      className="flex-1 flex flex-col h-full bg-white dark:bg-gray-900 mx-auto relative w-[90%] max-w-[1200px]"
    >
      <div
        ref={scrollContainerRef}
        className={`
          flex-1 thin-scrollbar overflow-y-auto transition-all duration-500 ease-out
          ${showMessages ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}
        style={{
          transitionProperty: 'opacity, visibility',
        }}
      >
        <MessageList bottomRef={bottomRef} />
      </div>

      {!isMasterMode && messages.length > 0 && !isNearBottom && (
        <button
          onClick={scrollToBottom}
          className="
            absolute bottom-34 right-4 z-30
            w-10 h-10 rounded-full
            bg-[color-mix(in_srgb,var(--color-accent)_10%,white)]
            border border-[var(--color-accent)]
            text-[var(--color-accent)]
            shadow-md
            hover:bg-[color-mix(in_srgb,var(--color-accent)_20%,white)]
            hover:shadow-lg
            active:scale-95
            transition-all duration-200
            flex items-center justify-center
            group
          "
          aria-label="Прокрутить вниз"
        >
          <ChevronDown size={20} strokeWidth={2.5} />

          {hasNewMessages && (
            <div className="
              absolute -top-1 -right-1
              w-3 h-3
              bg-red-500 rounded-full
              animate-pulse
              ring-2 ring-white dark:ring-gray-900
            " />
          )}
        </button>
      )}

      {isStreaming && (
        <div className="relative h-[3px] w-full overflow-hidden rounded-lg">
          <div className="absolute inset-0 loading-gradient" />
        </div>
      )}

      <div
        className={`
          w-full px-4 pb-6
          ${isMasterMode && !hasRealMessages
            ? 'max-w-2xl mx-auto mt-0'
            : 'max-w-full mt-auto'
          }
        `}
        style={{
          transform: isReady
            ? (isMasterMode && !hasRealMessages
              ? 'translateY(calc(-50vh + 50%))'
              : 'translateY(0)')
            : 'translateY(0)',
          transition: 'transform 500ms cubic-bezier(0.34, 1.2, 0.64, 1), max-width 500ms ease-out',
        }}
      >
        <FileDropZone>
          <InputArea />
        </FileDropZone>
      </div>
    </div>
  );
}