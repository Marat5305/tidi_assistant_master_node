// src/utils/citations.ts
import type { Citation } from '../types/chat';

const CITATION_PATTERN = /\[citation:(\d+)\]/g;
const MARKER_PATTERN = /\[(\d+)\]/g;

export function extractCitationIds(text: string): string[] {
  const ids: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = CITATION_PATTERN.exec(text)) !== null) {
    ids.push(match[1]);
  }

  return ids;
}

export function cleanCitationText(text: string): string {
  return text.replace(CITATION_PATTERN, (_, id: string) => `[${id}]`);
}

export function formatCitationText(text: string): string {
  return text.replace(MARKER_PATTERN, '**[$1]**');
}

export function getCitationsFromText(
  text: string,
  allCitations: Citation[]
): Citation[] {
  const ids = extractCitationIds(text);
  return ids
    .map((id) => allCitations.find((c) => c.id === id))
    .filter((c): c is Citation => c !== undefined);
}

export function groupCitationsBySource(
  citations: Citation[]
): Map<string, Citation[]> {
  const grouped = new Map<string, Citation[]>();

  for (const citation of citations) {
    const existing = grouped.get(citation.id);
    if (existing) {
      existing.push(citation);
    } else {
      grouped.set(citation.id, [citation]);
    }
  }

  return grouped;
}

export function getUniqueSources(citations: Citation[]): string[] {
  return [...new Set(citations.map((c) => c.id))];
}