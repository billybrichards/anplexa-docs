/**
 * Simplified Astrology Service
 *
 * Provides basic natal chart calculations using astronomical formulas.
 * This is a working implementation that can be enhanced with Swiss Ephemeris later.
 */
import type { IAstrologyCalculationService, CalculationOptions } from '@anplexa/core/domain/services/IAstrologyCalculationService';
import type { BirthData } from '@anplexa/core/domain/value-objects/astrology/BirthData';
import { NatalChartData } from '@anplexa/core/domain/value-objects/astrology/NatalChartData';
export declare class SimplifiedAstrologyService implements IAstrologyCalculationService {
    isAvailable(): Promise<boolean>;
    calculateNatalChart(birthData: BirthData, _options?: CalculationOptions): Promise<NatalChartData>;
    private createPlacement;
    private calculatePlanetaryPositions;
    private calculateHouses;
    private findHouse;
    private calculateAspects;
    private calculateDominants;
    private normalize;
    generateInterpretation(chartData: NatalChartData): Promise<string>;
    generateCompanionContext(chartData: NatalChartData): Promise<string>;
    private getSignDescription;
    private getElementDescription;
    private getModalityDescription;
    private getCommunicationGuidance;
    private getMoonSignNeed;
    private capitalize;
}
//# sourceMappingURL=SimplifiedAstrologyService.d.ts.map