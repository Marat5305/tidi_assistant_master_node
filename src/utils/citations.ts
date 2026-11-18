import type { Citation } from '../types/chat';

export function normalizeCitations(raw: any[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];

  for (const a of raw ?? []) {
    const key =
      a?.url ??
      a?.chunk_id ??
      a?.file_id ??
      a?.id ??
      `${a?.start_index ?? ''}-${a?.end_index ?? ''}-${a?.title ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      id: String(a?.chunk_id ?? a?.id ?? a?.file_id ?? a?.url ?? `src-${out.length + 1}`),
      number: out.length + 1,
      title: a?.title ?? a?.filename ?? a?.file_name ?? a?.document_name ?? undefined,
      snippet: a?.snippet ?? a?.text ?? a?.chunk ?? undefined,
      url: a?.url ?? a?.link ?? undefined,
      source: a?.type,
      text: a?.text,
    });
  }

  return out;
}

export function mergeCitations(prev: Citation[], nextRaw: any[]): Citation[] {
  const keyOf = (c: Citation, raw?: any) =>
    raw?.url ?? raw?.chunk_id ?? raw?.file_id ?? c.url ?? (c as any).file_id ?? c.id;

  const seen = new Set<string>();
  const out: Citation[] = [];

  for (const c of prev) {
    const k = keyOf(c);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ ...c, number: out.length + 1 });
  }

  for (const raw of nextRaw ?? []) {
    const k = keyOf(raw as any, raw);
    if (seen.has(k)) continue;
    seen.add(k);

    const normalized = normalizeCitations([raw])[0];
    if (!normalized) continue;
    out.push({ ...normalized, number: out.length + 1 });
  }

  return out;
}