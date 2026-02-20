import { describe, it, expect } from 'vitest';
import { PersonaBuilder } from '../PersonaBuilder.js';

describe('PersonaBuilder', () => {
  const builder = new PersonaBuilder();

  it('should build a basic persona with identity + personality + relationship', () => {
    const result = builder.buildPersona({
      name: 'Luna',
      gender: 'female',
      goal: 'empathetic companion',
    });

    expect(result).toContain('IDENTITY:');
    expect(result).toContain('Luna');
    expect(result).toContain('she/her');
    expect(result).toContain('PERSONALITY:');
    expect(result).toContain('RELATIONSHIP DYNAMICS:');
  });

  it('should include appearance when provided', () => {
    const result = builder.buildPersona({
      name: 'Nova',
      appearance: {
        height: '5\'7"',
        hairColor: 'silver',
        eyeColor: 'blue',
      },
    });

    expect(result).toContain('APPEARANCE:');
    expect(result).toContain('silver hair');
    expect(result).toContain('blue eyes');
  });

  it('should include personality traits', () => {
    const result = builder.buildPersona({
      name: 'Aria',
      personality: {
        socialStyle: 'warm and engaging',
        humor: 'dry wit',
        hobbies: ['reading', 'astronomy'],
      },
    });

    expect(result).toContain('warm and engaging');
    expect(result).toContain('dry wit');
    expect(result).toContain('reading, astronomy');
  });

  it('should truncate when exceeding max length', () => {
    const result = builder.buildPersona({
      name: 'Test',
      description: 'A'.repeat(5000),
    });

    expect(result.length).toBeLessThanOrEqual(3850);
  });

  it('should default to non-binary pronouns', () => {
    const result = builder.buildPersona({ name: 'Sky' });
    expect(result).toContain('they/them');
  });
});
