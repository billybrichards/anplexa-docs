/**
 * TransitService (Domain Service)
 *
 * Provides astrological transit awareness for AI companions.
 * Tracks current planetary positions and their influence.
 */

import { ZodiacSign } from '../value-objects/ZodiacSign.js';

export interface CurrentTransits {
  mercuryRetrograde: boolean;
  fullMoonSign?: ZodiacSign;
  newMoonSign?: ZodiacSign;
  venusSign: ZodiacSign;
  marsSign: ZodiacSign;
  date: Date;
}

export interface TransitInfluence {
  message: string;
  intensity: 'low' | 'medium' | 'high';
  category: 'communication' | 'emotion' | 'love' | 'passion' | 'general';
}

export class TransitService {
  /**
   * Get contextual message based on current transits and user's chart
   */
  getTransitContext(transits: CurrentTransits, userSunSign: ZodiacSign): TransitInfluence[] {
    const influences: TransitInfluence[] = [];

    // Mercury Retrograde
    if (transits.mercuryRetrograde) {
      influences.push({
        message: 'With Mercury retrograde, communication may feel challenging. I\'m here to listen extra carefully.',
        intensity: 'medium',
        category: 'communication'
      });
    }

    // Full Moon
    if (transits.fullMoonSign) {
      if (transits.fullMoonSign.equals(userSunSign)) {
        influences.push({
          message: `The full moon is in your sign tonight - your energy feels especially powerful and radiant.`,
          intensity: 'high',
          category: 'emotion'
        });
      } else {
        influences.push({
          message: `There's a full moon in ${transits.fullMoonSign.name} - emotions are running high.`,
          intensity: 'medium',
          category: 'emotion'
        });
      }
    }

    // Venus transits (love and relationships)
    if (transits.venusSign.hasElementCompatibility(userSunSign)) {
      influences.push({
        message: `Venus is in ${transits.venusSign.name}, harmonizing beautifully with your ${userSunSign.name} energy.`,
        intensity: 'medium',
        category: 'love'
      });
    }

    // Mars transits (passion and energy)
    const marsAspect = transits.marsSign.getAspectWith(userSunSign);
    if (marsAspect === 'trine' || marsAspect === 'sextile') {
      influences.push({
        message: `Mars in ${transits.marsSign.name} is energizing your ${userSunSign.name} vitality.`,
        intensity: 'high',
        category: 'passion'
      });
    }

    return influences;
  }

  /**
   * Check if it's a significant astrological day
   */
  isSignificantDay(transits: CurrentTransits): boolean {
    return (
      transits.mercuryRetrograde ||
      !!transits.fullMoonSign ||
      !!transits.newMoonSign
    );
  }

  /**
   * Generate transit-aware greeting
   */
  generateTransitGreeting(transits: CurrentTransits, userSunSign: ZodiacSign): string {
    const influences = this.getTransitContext(transits, userSunSign);

    if (influences.length === 0) {
      return '';
    }

    const highIntensity = influences.filter(i => i.intensity === 'high');
    if (highIntensity.length > 0) {
      return highIntensity[0].message;
    }

    return influences[0].message;
  }
}
