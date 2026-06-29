// src/hooks/useCitationHighlighter.ts
import { useMemo, useCallback } from 'react';
import type { Citation } from '../types/chat';
import {
  extractCitationIds,
  cleanCitationText,
  getCitationsFromText,
} from '../utils/citations';

interface UseCitationHighlighterReturn {
  cleanText: string;
  citationIds: string[];
  activeCitations: Citation[];
  getCitationById: (id: string) => Citation | undefined;
  getCitationsBySource: (source: string) => Citation[];
}

export function useCitationHighlighter(
  text: string,
  allCitations: Citation[]
): UseCitationHighlighterReturn {
  const citationIds = useMemo(() => extractCitationIds(text), [text]);

  const cleanText = useMemo(() => cleanCitationText(text), [text]);

  const activeCitations = useMemo(
    () => getCitationsFromText(text, allCitations),
    [text, allCitations]
  );

  const getCitationById = useCallback(
    (id: string): Citation | undefined => {
      return allCitations.find((c) => c.id === id);
    },
    [allCitations]
  );

  const getCitationsBySource = useCallback(
    (source: string): Citation[] => {
      return allCitations.filter((c) => c.id === source);
    },
    [allCitations]
  );

  return {
    cleanText,
    citationIds,
    activeCitations,
    getCitationById,
    getCitationsBySource,
  };
}