import { describe, it, expect } from 'vitest';
import {
  ChatActionStreamFilter,
  stripThinkBlocks,
  sanitizeAssistantOutput,
  sanitizeForChat,
  sanitizeForTTS,
} from '../ChatActionStreamFilter.js';

describe('ChatActionStreamFilter', () => {
  describe('text mode', () => {
    it('should pass through normal text', () => {
      const filter = new ChatActionStreamFilter('text');
      expect(filter.process('Hello world')).toBe('Hello world');
    });

    it('should strip *action* patterns', () => {
      const filter = new ChatActionStreamFilter('text');
      expect(filter.process('Hello *smiles warmly* how are you?')).toBe('Hello  how are you?');
    });

    it('should strip <think> blocks', () => {
      const filter = new ChatActionStreamFilter('text');
      expect(filter.process('<think>internal reasoning</think>Hello!')).toBe('Hello!');
    });

    it('should handle think blocks spanning multiple chunks', () => {
      const filter = new ChatActionStreamFilter('text');
      const r1 = filter.process('before<think>start');
      const r2 = filter.process(' of think</think>after');
      expect(r1 + r2).toBe('beforeafter');
    });

    it('should buffer incomplete *action* patterns', () => {
      const filter = new ChatActionStreamFilter('text');
      const r1 = filter.process('Hello *partial');
      expect(r1).toBe('Hello ');
      // Flush to get buffered content if action never closes
      const remaining = filter.flush();
      expect(remaining).toBe('*partial');
    });

    it('should strip multiple actions in one chunk', () => {
      const filter = new ChatActionStreamFilter('text');
      expect(filter.process('*nods* Yes *smiles* indeed')).toBe(' Yes  indeed');
    });
  });

  describe('voice mode', () => {
    it('should strip all formatting immediately', () => {
      const filter = new ChatActionStreamFilter('voice');
      expect(filter.process('Hello **world** how *are* you?')).toBe('Hello world how  you?');
    });

    it('should strip think blocks', () => {
      const filter = new ChatActionStreamFilter('voice');
      expect(filter.process('<think>reason</think>Hello')).toBe('Hello');
    });

    it('should have zero latency (no buffering)', () => {
      const filter = new ChatActionStreamFilter('voice');
      const r1 = filter.process('Hello ');
      const r2 = filter.process('world');
      expect(r1 + r2).toBe('Hello world');
    });
  });
});

describe('stripThinkBlocks', () => {
  it('should remove think blocks', () => {
    expect(stripThinkBlocks('before<think>hidden</think>after')).toBe('beforeafter');
  });

  it('should handle multiple think blocks', () => {
    expect(stripThinkBlocks('<think>a</think>middle<think>b</think>end')).toBe('middleend');
  });

  it('should handle multiline think blocks', () => {
    expect(stripThinkBlocks('<think>\nline1\nline2\n</think>visible')).toBe('visible');
  });

  it('should return text unchanged if no think blocks', () => {
    expect(stripThinkBlocks('no think blocks here')).toBe('no think blocks here');
  });
});

describe('sanitizeAssistantOutput', () => {
  it('should strip think blocks and trim', () => {
    expect(sanitizeAssistantOutput('  <think>hidden</think>Hello  ')).toBe('Hello');
  });

  it('should collapse excessive newlines', () => {
    expect(sanitizeAssistantOutput('line1\n\n\n\nline2')).toBe('line1\n\nline2');
  });
});

describe('sanitizeForChat', () => {
  it('should behave same as sanitizeAssistantOutput', () => {
    const input = '<think>hidden</think>Hello\n\n\n\nworld';
    expect(sanitizeForChat(input)).toBe(sanitizeAssistantOutput(input));
  });
});

describe('sanitizeForTTS', () => {
  it('should strip all formatting for speech', () => {
    expect(sanitizeForTTS('Hello **bold** and *action happens* world')).toBe('Hello bold and world');
  });

  it('should strip think blocks', () => {
    expect(sanitizeForTTS('<think>hidden</think>Spoken text')).toBe('Spoken text');
  });

  it('should strip markdown links', () => {
    expect(sanitizeForTTS('Click [here](https://example.com) please')).toBe('Click please');
  });

  it('should replace paragraph breaks with periods', () => {
    expect(sanitizeForTTS('First paragraph\n\nSecond paragraph')).toBe('First paragraph. Second paragraph');
  });

  it('should collapse whitespace', () => {
    expect(sanitizeForTTS('too   many    spaces')).toBe('too many spaces');
  });
});
