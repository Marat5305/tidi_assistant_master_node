import { Wrench, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  icon?: LucideIcon;
  object?: string;
  owned_by?: string;
  created?: number;
}

export const AGENTS: AgentConfig[] = [
  // {
  //   id: '',
  //   name: 'Все агенты',
  //   description: 'Все агенты',
  //   icon: ListIndentIncrease,
  // },
  // {
  //   id: 'epoz',
  //   name: 'ЕПоЗ',
  //   description: 'Единое Положение о закупках',
  //   icon: Wallet,
  // },
  {
    id: 'chat',
    name: 'Общий чат',
    description: 'Общение на общие темы',
    icon: Wallet,

  },
  {
    id: 'tech_rag',
    name: 'RAG по технической документации',
    description: 'Ответы на вопросы по технической документации',
    icon: Wrench,
  },
  {
    "id": "document_chat",
    "name": "Документы + LLM",
    "object": "model",
    "created": 1792914039,
    "owned_by": " ",
    description: '',
    icon: undefined
  },
  {
    "id": "agentic_rag",
    "name": "RAG по пользовательским наборам",
    "object": "model",
    "created": 1792914039,
    "owned_by": " ",
    description: '',
    icon: undefined
  },
  // {
  //   "id": "auto",
  //   "name": "auto",
  //   "object": "model",
  //   "created": 1792914039,
  //   "owned_by": " ",
  //   description: '',
  //   icon: undefined
  // }
];

//  Icon
// book-open-check