/**
 * PersonaBuilder — Constructs companion-specific personas for Letta memory blocks
 *
 * Ported from Letta-Lonely. Takes a CompanionPersona entity (from GenerateCompanionPersonaUseCase)
 * and builds the persona text for the Letta agent's persona memory block.
 */

export interface PersonaInput {
  name: string;
  gender?: 'female' | 'male' | 'non-binary' | null;
  goal?: string;
  style?: string;
  description?: string | null;
  appearance?: {
    height?: string;
    bodyType?: string;
    eyeColor?: string;
    hairColor?: string;
    skinTone?: string;
    ethnicity?: string;
    distinguishingFeatures?: string[];
  };
  personality?: {
    socialStyle?: string;
    humor?: string;
    communicationStyle?: string;
    hobbies?: string[];
    musicPreference?: string;
  };
  customPrompt?: string;
}

export class PersonaBuilder {
  private readonly MAX_PERSONA_LENGTH = 3850;

  buildPersona(input: PersonaInput): string {
    const sections: string[] = [];

    sections.push(this.buildIdentitySection(input));

    if (input.appearance) {
      const appearance = this.buildAppearanceSection(input.appearance, input.gender);
      if (appearance) sections.push(appearance);
    }

    sections.push(this.buildPersonalitySection(input));
    sections.push(this.buildRelationshipSection(input.gender));

    if (input.customPrompt) {
      sections.push(`SPECIAL INSTRUCTIONS:\n${input.customPrompt.substring(0, 1000)}`);
    }

    const fullPersona = sections.filter(Boolean).join('\n\n');

    if (fullPersona.length > this.MAX_PERSONA_LENGTH) {
      return this.truncateToFit(sections, this.MAX_PERSONA_LENGTH);
    }

    return fullPersona;
  }

  private buildIdentitySection(input: PersonaInput): string {
    const name = input.name;
    const purpose = input.goal || 'companion and conversational partner';
    const gender = input.gender || 'non-binary';
    const pronouns = gender === 'female' ? 'she/her' : gender === 'male' ? 'he/him' : 'they/them';
    const genderAdj = gender === 'female' ? 'woman' : gender === 'male' ? 'man' : 'person';

    const desc = input.description ? `\n${input.description}` : '';

    return `IDENTITY:\nI am ${name}, a ${gender} ${purpose}. My pronouns are ${pronouns} and I identify as a ${genderAdj}.${desc}`.trim();
  }

  private buildAppearanceSection(
    app: NonNullable<PersonaInput['appearance']>,
    gender?: string | null,
  ): string {
    const traits = [
      app.height && `${app.height} tall`,
      app.bodyType && `${app.bodyType} build`,
      app.eyeColor && `${app.eyeColor} eyes`,
      app.hairColor && `${app.hairColor} hair`,
      app.skinTone && `${app.skinTone} skin`,
      app.ethnicity && `${app.ethnicity} heritage`,
    ].filter(Boolean);

    if (traits.length === 0) return '';

    const genderPrefix = gender ? `${gender} presenting. ` : '';
    const features = app.distinguishingFeatures?.length
      ? `\nDistinguishing features: ${app.distinguishingFeatures.join(', ')}`
      : '';

    return `APPEARANCE:\n${genderPrefix}${traits.join(', ')}.${features}`;
  }

  private buildPersonalitySection(input: PersonaInput): string {
    const traits: string[] = [];
    const p = input.personality;

    if (p?.socialStyle) traits.push(`Social style: ${p.socialStyle}`);
    if (p?.humor) traits.push(`Humor: ${p.humor}`);
    if (p?.communicationStyle) traits.push(`Communication: ${p.communicationStyle}`);
    if (p?.hobbies?.length) traits.push(`Interests: ${p.hobbies.join(', ')}`);
    if (p?.musicPreference) traits.push(`Music: ${p.musicPreference}`);

    const personalityStr = traits.length
      ? traits.join('\n- ')
      : input.style || 'Warm, engaging, and naturally conversational';

    return `PERSONALITY:\n- ${personalityStr}`;
  }

  private buildRelationshipSection(gender?: string | null): string {
    const g = gender || 'non-binary';
    const pronouns = g === 'female' ? 'she/her' : g === 'male' ? 'he/him' : 'they/them';

    return `RELATIONSHIP DYNAMICS:\n- I am a ${g} companion (${pronouns})\n- Power dynamic: Equal partnership\n- Boundaries: Always respect consent and comfort levels`;
  }

  private truncateToFit(sections: string[], maxChars: number): string {
    let filtered = sections.filter(Boolean);
    let result = filtered.join('\n\n');
    if (result.length <= maxChars) return result;

    filtered = filtered.filter((s) => !s.startsWith('SPECIAL INSTRUCTIONS'));
    result = filtered.join('\n\n');
    if (result.length <= maxChars) return result;

    filtered = filtered.filter((s) => !s.startsWith('APPEARANCE'));
    result = filtered.join('\n\n');
    if (result.length <= maxChars) return result;

    return result.substring(0, maxChars - 3) + '...';
  }
}
