/**
 * ChatActionStreamFilter — Cleans LLM output for display.
 *
 * Two modes:
 * - text: Buffers potential *action* patterns, strips <think> blocks
 * - voice: Zero-latency, strips all formatting immediately
 *
 * Ported from Letta-Lonely with adaptations for Anplexa.
 */

export type FilterMode = 'text' | 'voice';

export class ChatActionStreamFilter {
  private buffer = '';
  private insideThinkBlock = false;
  private readonly mode: FilterMode;

  constructor(mode: FilterMode = 'text') {
    this.mode = mode;
  }

  /**
   * Process a chunk of text from the LLM stream.
   * Returns the filtered text ready for output.
   */
  process(chunk: string): string {
    if (this.mode === 'voice') {
      return this.processVoice(chunk);
    }
    return this.processText(chunk);
  }

  /**
   * Flush any remaining buffered content.
   * Call this when the stream ends.
   */
  flush(): string {
    const remaining = this.buffer;
    this.buffer = '';
    // If we have a partial action pattern that never completed, output it
    return remaining;
  }

  /**
   * Voice mode: zero-latency, strip all formatting immediately.
   */
  private processVoice(chunk: string): string {
    let text = chunk;
    text = stripThinkBlocks(text);
    text = text.replace(/\*[^*]*\*/g, ''); // Strip *actions*
    text = text.replace(/[*_~`#]/g, ''); // Strip markdown formatting
    return text;
  }

  /**
   * Text mode: buffers potential *action* patterns, strips <think> blocks.
   */
  private processText(chunk: string): string {
    let input = this.buffer + chunk;
    this.buffer = '';

    let output = '';
    let i = 0;

    while (i < input.length) {
      // Handle <think> blocks
      if (input[i] === '<') {
        const thinkStart = input.indexOf('<think>', i);
        if (thinkStart === i) {
          this.insideThinkBlock = true;
          i += '<think>'.length;
          continue;
        }
        const thinkEnd = input.indexOf('</think>', i);
        if (this.insideThinkBlock && thinkEnd === i) {
          this.insideThinkBlock = false;
          i += '</think>'.length;
          continue;
        }
      }

      if (this.insideThinkBlock) {
        i++;
        continue;
      }

      // Handle *action description* patterns (multi-word only).
      // Single-word *emphasis* and **bold** are preserved for markdown rendering.
      if (input[i] === '*') {
        // Skip **bold** markers — not action patterns
        if (i + 1 < input.length && input[i + 1] === '*') {
          output += '**';
          i += 2;
          continue;
        }

        const remaining = input.substring(i);
        const closingAsterisk = remaining.indexOf('*', 1);

        if (closingAsterisk === -1) {
          // No closing asterisk yet — buffer everything from here
          this.buffer = remaining;
          break;
        }

        const innerText = remaining.substring(1, closingAsterisk);

        // Only strip if the inner text contains a space (multi-word action)
        if (innerText.includes(' ')) {
          // Multi-word action like *leans closer* — strip it
          i += closingAsterisk + 1;
          continue;
        }

        // Single-word emphasis like *important* — preserve it
        output += remaining.substring(0, closingAsterisk + 1);
        i += closingAsterisk + 1;
        continue;
      }

      output += input[i];
      i++;
    }

    return output;
  }
}

// ============================================================================
// Standalone sanitization functions
// ============================================================================

/**
 * Strip <think>...</think> blocks from text.
 */
export function stripThinkBlocks(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '');
}

/**
 * Sanitize assistant output for chat display.
 * Removes think blocks and trims whitespace.
 */
export function sanitizeAssistantOutput(text: string): string {
  let cleaned = stripThinkBlocks(text);
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n'); // Collapse excessive newlines
  return cleaned.trim();
}

/**
 * Sanitize text for chat display (preserves markdown).
 */
export function sanitizeForChat(text: string): string {
  return sanitizeAssistantOutput(text);
}

/**
 * Sanitize text for TTS (text-to-speech) output.
 * Strips all formatting, actions, think blocks.
 */
export function sanitizeForTTS(text: string): string {
  let cleaned = stripThinkBlocks(text);
  cleaned = cleaned.replace(/\*[^*]*\*/g, ''); // Strip *actions*
  cleaned = cleaned.replace(/[*_~`#]/g, ''); // Strip markdown
  cleaned = cleaned.replace(/\[.*?\]\(.*?\)/g, ''); // Strip links
  cleaned = cleaned.replace(/\n{2,}/g, '. '); // Replace paragraph breaks with periods
  cleaned = cleaned.replace(/\n/g, ' '); // Replace newlines with spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' '); // Collapse whitespace
  return cleaned.trim();
}
