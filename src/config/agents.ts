import { Bot, Shield, Wrench } from 'lucide-react';
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
    name: 'ЕПОЗ',
    description: 'Единое Положение о закупках',
    icon: Shield,
  },
  {
    id: 'general',
    name: 'Ассистент',
    description: 'Общие вопросы и помощь',
    icon: Bot,
  },
  {
    id: 'technical',
    name: 'Технический',
    description: 'Техническая поддержка',
    icon: Wrench,
  },
];