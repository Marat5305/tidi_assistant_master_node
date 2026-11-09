// src/components/chat/MessageItem.tsx
import Markdown from 'react-markdown';
import { Fragment } from 'react';
import type { Message, Citation } from '../../types/chat';
import { markdownComponents, markdownPlugins } from '../../utils/markdown.tsx';

interface MessageItemProps {
  message: Message;
  onCitationClick?: (citationId: string) => void;
  activeCitationId?: string | null;
}

// Поддерживаем оба варианта: [citation:1] и [source:1]
const CITATION_SPLIT_RE = /(\[(?:citation|source):\d+\])/g;
const CITATION_MATCH_RE = /\[(?:citation|source):(\d+)\]/;

export function MessageItem({
  message,
  onCitationClick,
  activeCitationId,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const citations: Citation[] | undefined = message.citations;

  const renderMarkdown = (text: string, keyPrefix: string) => (
    <Markdown
      key={keyPrefix}
      components={markdownComponents}
      remarkPlugins={markdownPlugins}
    >
      {text}
    </Markdown>
  );

  const renderContent = (content: string) => {
    // Нет цитат — рендерим целиком
    if (!citations || citations.length === 0) {
      return renderMarkdown(content, 'md-full');
    }

    const parts = content.split(CITATION_SPLIT_RE);

    return parts.map((part, index) => {
      const match = part.match(CITATION_MATCH_RE);

      if (match) {
        const citationNumber = parseInt(match[1], 10);

        // Сначала по number, потом fallback по порядку
        const byNumber = citations.find((c) => c.number === citationNumber);
        const citation = byNumber ?? citations[citationNumber - 1];

        const citationId = citation?.id;
        const isActive = !!citationId && citationId === activeCitationId;

        return (
          <button
            key={`cite-${index}`}
            type="button"
            onClick={() => citationId && onCitationClick?.(citationId)}
            title={citation?.title ?? 'Источник'}
            className={`
              inline-flex items-center px-1 rounded transition-all align-baseline
              ${
                isActive
                  ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] font-bold'
                  : 'bg-[var(--color-accent)]/5 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/15'
              }
            `}
          >
            [{citationNumber}]
          </button>
        );
      }

      // Пустые куски между цитатами не рендерим
      if (!part) return null;

      return (
        <Fragment key={`md-${index}`}>{renderMarkdown(part, `md-${index}`)}</Fragment>
      );
    });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[70%] rounded-lg px-4 py-2 mx-6 border
          ${
            isUser
              ? 'bg-[var(--color-surface)] border-[var(--color-accent)] text-black'
              : 'bg-white dark:bg-gray-700 border-[var(--color-surface)] shadow-sm text-gray-900 dark:text-white'
          }
        `}
      >
        {renderContent(message.content)}
      </div>
    </div>
  );
}