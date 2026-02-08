/**
 * Dependency Injection Container
 *
 * Simple DI container for managing service and use case dependencies.
 * Provides singleton instances of all application services.
 */

import { TraitExtractionService } from '@anplexa/core/domain/services/astrology/TraitExtractionService';
import { CompatibilityCalculationService } from '@anplexa/core/domain/services/astrology/CompatibilityCalculationService';
import { ClaudeTraitAnalysisService } from '@anplexa/services/ai/ClaudeTraitAnalysisService';
import {
  AnalyzeChartPersonalityUseCase,
  CalculateCompatibilityUseCase,
} from '@anplexa/core/use-cases/astrology';

/**
 * Application Container
 *
 * Holds singleton instances of all services and use cases.
 * Lazy initialization - services are created on first access.
 */
class Container {
  private static instance: Container;

  // Services
  private _traitExtractionService?: TraitExtractionService;
  private _compatibilityCalculationService?: CompatibilityCalculationService;
  private _traitAnalysisService?: ClaudeTraitAnalysisService;

  // Use Cases
  private _analyzeChartPersonalityUseCase?: AnalyzeChartPersonalityUseCase;
  private _calculateCompatibilityUseCase?: CalculateCompatibilityUseCase;

  private constructor() {}

  /**
   * Get singleton instance of container
   */
  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  // ────────────────────────────────────────────────────────────────
  // Services
  // ────────────────────────────────────────────────────────────────

  get traitExtractionService(): TraitExtractionService {
    if (!this._traitExtractionService) {
      this._traitExtractionService = new TraitExtractionService();
    }
    return this._traitExtractionService;
  }

  get compatibilityCalculationService(): CompatibilityCalculationService {
    if (!this._compatibilityCalculationService) {
      this._compatibilityCalculationService = new CompatibilityCalculationService();
    }
    return this._compatibilityCalculationService;
  }

  get traitAnalysisService(): ClaudeTraitAnalysisService {
    if (!this._traitAnalysisService) {
      // API key from environment variable
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.warn('ANTHROPIC_API_KEY not configured - AI features will not work');
      }
      this._traitAnalysisService = new ClaudeTraitAnalysisService(apiKey);
    }
    return this._traitAnalysisService;
  }

  // ────────────────────────────────────────────────────────────────
  // Use Cases
  // ────────────────────────────────────────────────────────────────

  get analyzeChartPersonalityUseCase(): AnalyzeChartPersonalityUseCase {
    if (!this._analyzeChartPersonalityUseCase) {
      this._analyzeChartPersonalityUseCase = new AnalyzeChartPersonalityUseCase(
        this.traitExtractionService,
        this.traitAnalysisService
      );
    }
    return this._analyzeChartPersonalityUseCase;
  }

  get calculateCompatibilityUseCase(): CalculateCompatibilityUseCase {
    if (!this._calculateCompatibilityUseCase) {
      this._calculateCompatibilityUseCase = new CalculateCompatibilityUseCase(
        this.compatibilityCalculationService,
        this.traitAnalysisService
      );
    }
    return this._calculateCompatibilityUseCase;
  }

  // ────────────────────────────────────────────────────────────────
  // Utility Methods
  // ────────────────────────────────────────────────────────────────

  /**
   * Reset all singleton instances (useful for testing)
   */
  reset(): void {
    this._traitExtractionService = undefined;
    this._compatibilityCalculationService = undefined;
    this._traitAnalysisService = undefined;
    this._analyzeChartPersonalityUseCase = undefined;
    this._calculateCompatibilityUseCase = undefined;
  }
}

// Export singleton instance
export const container = Container.getInstance();
