// src/services/streamParser.ts
import type { StreamChunk } from '../types/chat';

export class StreamParser {
  private buffer: string;

  constructor() {
    this.buffer = '';
  }

  parse(chunk: string): StreamChunk[] {
    this.buffer += chunk;
    const chunks: StreamChunk[] = [];
    const lines = this.buffer.split('\n');

    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0) {
        continue;
      }
      chunks.push(this.parseLine(trimmedLine));
    }

    return chunks;
  }

  private parseLine(line: string): StreamChunk {
    let data: unknown;

    try {
      data = JSON.parse(line);
    } catch {
      return { type: 'text', content: line };
    }

    if (!this.isValidStreamData(data)) {
      return { type: 'text', content: line };
    }

    return this.normalizeChunk(data);
  }

  private isValidStreamData(data: unknown): data is Record<string, unknown> {
    return typeof data === 'object' && data !== null;
  }

  private normalizeChunk(data: Record<string, unknown>): StreamChunk {
    if (data.done === true) {
      return { type: 'done' };
    }

    if (typeof data.error === 'string') {
      return { type: 'error', error: data.error };
    }

    if (data.citation !== null && typeof data.citation === 'object') {
      return {
        type: 'citation',
        citation: data.citation as StreamChunk['citation'],
      };
    }

    const content =
      typeof data.content === 'string'
        ? data.content
        : typeof data.text === 'string'
          ? data.text
          : typeof data.delta === 'string'
            ? data.delta
            : undefined;

    if (content) {
      return { type: 'text', content };
    }

    return { type: 'text', content: String(data) };
  }

  reset(): void {
    this.buffer = '';
  }

  getBuffer(): string {
    return this.buffer;
  }
}