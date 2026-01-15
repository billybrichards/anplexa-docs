/**
 * SendCosmicMessageUseCase
 *
 * Handles sending messages to AI companion with memory and transit awareness.
 */

import { Companion } from '../../domain/entities/Companion.js';
import { BirthChart } from '../../domain/entities/BirthChart.js';
import { Memory } from '../../domain/entities/Memory.js';
import { ICompanionRepository } from '../../domain/repositories/ICompanionRepository.js';
import { IBirthChartRepository } from '../../domain/repositories/IBirthChartRepository.js';
import { IMemoryRepository } from '../../domain/repositories/IMemoryRepository.js';
import { TransitService } from '../../domain/services/TransitService.js';
import { IAIService } from '../ports/IAIService.js';
import { IEphemerisService } from '../ports/IEphemerisService.js';
import { CompanionNotFoundError, BirthChartNotFoundError } from '../../domain/errors/CosmicDomainError.js';
import { ZodiacSign } from '../../domain/value-objects/ZodiacSign.js';
import { randomUUID } from 'crypto';

export interface SendCosmicMessageInput {
  userId: string;
  companionId: string;
  message: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface SendCosmicMessageOutput {
  response: string;
  transitContext?: string;
}

export class SendCosmicMessageUseCase {
  constructor(
    private readonly companionRepository: ICompanionRepository,
    private readonly birthChartRepository: IBirthChartRepository,
    private readonly memoryRepository: IMemoryRepository,
    private readonly aiService: IAIService,
    private readonly ephemerisService: IEphemerisService,
    private readonly transitService: TransitService
  ) {}

  async execute(input: SendCosmicMessageInput): Promise<SendCosmicMessageOutput> {
    // Get companion
    const companion = await this.companionRepository.findById(input.companionId);
    if (!companion) {
      throw new CompanionNotFoundError(input.companionId);
    }

    // Get user's birth chart
    const birthChart = await this.birthChartRepository.findByUserId(input.userId);
    if (!birthChart) {
      throw new BirthChartNotFoundError(input.userId);
    }

    // Get relevant memories
    const memories = await this.memoryRepository.findRecentByCompanionId(input.companionId, 10);
    const importantMemories = await this.memoryRepository.findImportantByCompanionId(input.companionId, 70);
    const allMemories = [...memories, ...importantMemories];
    const memoryContext = this.buildMemoryContext(allMemories);

    // Get current transits
    const transits = await this.ephemerisService.getCurrentTransits();
    const transitInfluences = this.transitService.getTransitContext(
      {
        mercuryRetrograde: transits.mercuryRetrograde,
        venusSign: ZodiacSign.fromName(transits.venusSign),
        marsSign: ZodiacSign.fromName(transits.marsSign),
        fullMoonSign: transits.fullMoonSign ? ZodiacSign.fromName(transits.fullMoonSign) : undefined,
        newMoonSign: transits.newMoonSign ? ZodiacSign.fromName(transits.newMoonSign) : undefined,
        date: new Date()
      },
      birthChart.sunSign
    );
    const transitContext = transitInfluences.length > 0 ? transitInfluences[0].message : undefined;

    // Generate AI response
    const aiResponse = await this.aiService.generateResponse({
      systemPrompt: companion.generateSystemPrompt(),
      conversationHistory: input.conversationHistory,
      memoryContext,
      transitContext
    });

    // Extract important information from message for memory storage
    await this.extractAndStoreMemory(input.message, companion, input.userId);

    return {
      response: aiResponse.content,
      transitContext
    };
  }

  private buildMemoryContext(memories: Memory[]): string {
    if (memories.length === 0) {
      return '';
    }

    const grouped = {
      preferences: memories.filter(m => m.category === 'preference'),
      events: memories.filter(m => m.category === 'event'),
      intimate: memories.filter(m => m.category === 'intimate'),
      astrological: memories.filter(m => m.category === 'astrological')
    };

    const parts: string[] = [];

    if (grouped.preferences.length > 0) {
      parts.push('User preferences: ' + grouped.preferences.map(m => m.content).join('; '));
    }
    if (grouped.intimate.length > 0) {
      parts.push('Intimate preferences: ' + grouped.intimate.map(m => m.content).join('; '));
    }
    if (grouped.astrological.length > 0) {
      parts.push('Astrological notes: ' + grouped.astrological.map(m => m.content).join('; '));
    }

    return parts.join('\n');
  }

  private async extractAndStoreMemory(message: string, companion: Companion, userId: string): Promise<void> {
    // Simple keyword-based memory extraction (in production, use NLP)
    const lowerMessage = message.toLowerCase();

    // Detect preferences
    if (lowerMessage.includes('i like') || lowerMessage.includes('i love') || lowerMessage.includes('i prefer')) {
      const memory = Memory.create(
        randomUUID(),
        companion.id,
        userId,
        'medium-term',
        'preference',
        message,
        60 // Medium importance
      );
      await this.memoryRepository.save(memory);
    }

    // Detect astrological mentions
    const zodiacSigns = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    const mentionsZodiac = zodiacSigns.some(sign => lowerMessage.includes(sign));
    if (mentionsZodiac) {
      const memory = Memory.create(
        randomUUID(),
        companion.id,
        userId,
        'long-term',
        'astrological',
        message,
        80 // High importance
      );
      await this.memoryRepository.save(memory);
    }
  }
}
