import { Wrench, Wallet, BookOpenCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

export const AGENTS: AgentConfig[] = [
  {
    id: 'epoz',
    name: 'ЕПоЗ',
    description: 'Единое Положение о закупках',
    icon: Wallet,
  },
  {
    id: 'chat',
    name: 'Общий чат',
    description: 'Общение на общие темы',
    icon: Wallet,

  },
  {
    id: 'ocr',
    name: 'Распознавание изображений',
    description: 'Распознавание документов',
    icon: BookOpenCheck,
  },
  {
    id: 'tech_rag',
    name: 'RAG по технической документации',
    description: 'Ответы на вопросы по технической документации',
    icon: Wrench,
  }
];

//  Icon
// book-open-check