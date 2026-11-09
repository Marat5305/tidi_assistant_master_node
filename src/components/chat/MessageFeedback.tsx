// src/components/chat/MessageFeedback.tsx
import * as Tooltip from '@radix-ui/react-tooltip';
import { ThumbsUp, ThumbsDown, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/DropdownMenu';
import { useChatStore } from '../../store/chatStore';

interface MessageFeedbackProps {
  completionId: string;
  messageContent?: string;
}

export function MessageFeedback({
  completionId,
  messageContent,
}: MessageFeedbackProps) {
  const [feedback, setFeedbackLocal] = useState<'like' | 'dislike' | null>(null);
  const [feedbackReason, setFeedbackReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customReasonText, setCustomReasonText] = useState<string | null>(null);

  const setFeedback = useChatStore((s) => s.setFeedback);
  const deleteFeedback = useChatStore((s) => s.deleteFeedback);

  useEffect(() => {
    if (feedbackReason && import.meta.env.DEV) {
      console.log(`Feedback reason for ${completionId}: ${feedbackReason}`);
    }
  }, [feedbackReason, completionId]);

  // ---------- Лайк ----------
  const handleLike = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (feedback === 'like') {
        // снимаем лайк
        await deleteFeedback(completionId);
        setFeedbackLocal(null);
        setFeedbackReason(null);
        if (import.meta.env.DEV) console.log('Unlike:', completionId);
      } else {
        // если стоял дизлайк — сначала снимаем его на бэке
        if (feedback === 'dislike') {
          try {
            await deleteFeedback(completionId);
          } catch {
            /* не критично */
          }
        }
        await setFeedback(completionId, 1);
        setFeedbackLocal('like');
        setFeedbackReason(null);
        if (import.meta.env.DEV)
          console.log('Like:', completionId, messageContent?.slice(0, 40));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Дизлайк с причиной ----------
  const handleDislikeReason = async (reason: string) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      // если стоял лайк — снимаем
      if (feedback === 'like') {
        try {
          await deleteFeedback(completionId);
        } catch {
          /* не критично */
        }
      }
      await setFeedback(completionId, -1, reason);
      setFeedbackLocal('dislike');
      setFeedbackReason(reason);
      if (import.meta.env.DEV)
        console.log('Dislike:', completionId, '| Reason:', reason);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Снятие дизлайка ----------
  const handleDislikeClick = async (e: React.MouseEvent) => {
    if (isLoading) return;
    if (feedback === 'dislike') {
      e.preventDefault(); // не даём открыться меню
      setIsLoading(true);
      try {
        await deleteFeedback(completionId);
        setFeedbackLocal(null);
        setFeedbackReason(null);
        if (import.meta.env.DEV) console.log('Cancel dislike:', completionId);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ---------- Кастомная причина ----------
  const handleCustomReasonSubmit = () => {
    const trimmed = (customReasonText || '').trim();
    if (trimmed) {
      handleDislikeReason(trimmed);
      setCustomReasonText(null);
      setIsDropdownOpen(false);
    }
  };

  // ---------- Поделиться ----------
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(messageContent ?? '');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2 mx-6">
      {/* Лайк */}
      <Tooltip.Provider>
        <Tooltip.Root delayDuration={200}>
          <Tooltip.Trigger asChild>
            <button
              onClick={handleLike}
              disabled={isLoading}
              className={`p-1 rounded-md transition-all hover:scale-110 ${
                isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-label="Полезный ответ"
            >
              <ThumbsUp
                size={16}
                className={`transition-colors ${
                  feedback === 'like' ? 'text-green-500' : 'text-gray-500'
                }`}
              />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="px-2 py-1 text-xs bg-gray-900 text-white rounded-md"
              sideOffset={5}
            >
              Полезный ответ
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>

      {/* Дизлайк + DropdownMenu */}
      <Tooltip.Provider>
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <Tooltip.Root delayDuration={200}>
            <DropdownMenuTrigger asChild>
              <Tooltip.Trigger asChild>
                <button
                  onPointerDown={handleDislikeClick}
                  disabled={isLoading}
                  className={`p-1 rounded-md transition-all hover:scale-110 ${
                    isLoading
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Не помогло"
                >
                  <ThumbsDown
                    size={16}
                    className={`transition-colors ${
                      feedback === 'dislike' ? 'text-red-500' : 'text-gray-500'
                    }`}
                  />
                </button>
              </Tooltip.Trigger>
            </DropdownMenuTrigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="px-2 py-1 text-xs bg-gray-900 text-white rounded-md"
                sideOffset={5}
              >
                Не помогло
                <Tooltip.Arrow className="fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <DropdownMenuContent align="start" side="top">
            <DropdownMenuItem onSelect={() => handleDislikeReason('factual_error')}>
              Ответ содержит фактическую ошибку
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDislikeReason('off_topic')}>
              Ответ не по теме
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDislikeReason('incomplete')}>
              Ответ неполный
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleDislikeReason('no_sources')}>
              Нет ссылок на источники
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {customReasonText !== null ? (
              <div className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customReasonText}
                    onChange={(e) => setCustomReasonText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCustomReasonSubmit();
                      }
                      if (e.key === 'Escape') {
                        e.stopPropagation();
                        setCustomReasonText(null);
                      }
                    }}
                    placeholder="Введите причину..."
                    className="flex-1 px-2 py-1 text-sm rounded border border-[var(--color-accent)]
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                      focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                    autoFocus
                  />
                  <button
                    onClick={handleCustomReasonSubmit}
                    disabled={!customReasonText.trim()}
                    className="px-2 py-1 text-xs rounded bg-[var(--color-accent)] text-white
                      hover:bg-[var(--color-hover)] disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors"
                  >
                    OK
                  </button>
                </div>
              </div>
            ) : (
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setCustomReasonText('');
                }}
              >
                Другое
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip.Provider>

      {/* Поделиться */}
      <Tooltip.Provider>
        <Tooltip.Root delayDuration={200}>
          <Tooltip.Trigger asChild>
            <button
              onClick={handleShare}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-110"
              aria-label="Поделиться"
            >
              <Share2 size={16} className="text-gray-500 transition-colors" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="px-2 py-1 text-xs bg-gray-900 text-white rounded-md"
              sideOffset={5}
            >
              Скопировать ответ
              <Tooltip.Arrow className="fill-gray-900" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    </div>
  );
}