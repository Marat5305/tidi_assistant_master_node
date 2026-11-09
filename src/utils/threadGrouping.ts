// src/utils/threadGrouping.ts
import type { Conversation } from '../types/chat';

export type ThreadGroup = {
  title: string; // "Сегодня", "Вчера", "На этой неделе", "Ранее"
  threads: Conversation[];
};

/**
 * Группирует беседы по датам.
 * @param threads — массив бесед
 * @returns массив непустых групп для рендеринга
 */
export function groupThreadsByDate(threads: Conversation[]): ThreadGroup[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups: ThreadGroup[] = [
    { title: 'Сегодня', threads: [] },
    { title: 'Вчера', threads: [] },
    { title: 'На этой неделе', threads: [] },
    { title: 'Ранее', threads: [] },
  ];

  if (!threads || threads.length === 0) {
    return [];
  }

  for (const thread of threads) {
    // Пропускаем OCR-беседы, если они не должны показываться в истории
    if (thread.model === 'ocr') continue;

    // Если нет ни updated_at, ни created_at — отправляем в «Ранее»
    const rawDate = thread.updated_at ?? thread.created_at;
    if (!rawDate) {
      groups[3].threads.push(thread);
      continue;
    }

    const threadDate = new Date(rawDate);
    if (isNaN(threadDate.getTime())) {
      groups[3].threads.push(thread);
      continue;
    }

    const compareDate = new Date(
      threadDate.getFullYear(),
      threadDate.getMonth(),
      threadDate.getDate(),
    );

    if (compareDate.getTime() === today.getTime()) {
      groups[0].threads.push(thread);
    } else if (compareDate.getTime() === yesterday.getTime()) {
      groups[1].threads.push(thread);
    } else if (compareDate >= weekAgo) {
      groups[2].threads.push(thread);
    } else {
      groups[3].threads.push(thread);
    }
  }

  // Возвращаем только непустые группы
  return groups.filter((group) => group.threads.length > 0);
}