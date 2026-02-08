/**
 * Natal Chart Data Value Object
 *
 * Contains all calculated astrological data for a complete natal chart.
 * Immutable value object representing the state of the cosmos at birth.
 */
import { ZodiacSign, type ZodiacSignName } from './ZodiacSign.js';
export interface PlanetPlacement {
    planetName: string;
    sign: ZodiacSign;
    house: number | null;
    degree: number;
    speed: number;
    isRetrograde: boolean;
}
export interface AspectData {
    planet1: string;
    planet2: string;
    aspectType: 'conjunction' | 'opposition' | 'trine' | 'square' | 'sextile' | 'semisextile' | 'semisquare' | 'sesquiquadrate';
    orb: number;
    strength: number;
    isApplying: boolean;
}
export interface House {
    number: number;
    cuspDegree: number;
    cuspSign: ZodiacSign;
    planets: string[];
}
export interface NatalChartDataProps {
    planets: {
        sun: PlanetPlacement;
        moon: PlanetPlacement;
        mercury: PlanetPlacement;
        venus: PlanetPlacement;
        mars: PlanetPlacement;
        jupiter: PlanetPlacement;
        saturn: PlanetPlacement;
        uranus: PlanetPlacement;
        neptune: PlanetPlacement;
        pluto: PlanetPlacement;
        northNode: PlanetPlacement;
        southNode: PlanetPlacement;
    };
    houses: House[];
    aspects: AspectData[];
    dominantElement: 'fire' | 'earth' | 'air' | 'water';
    dominantModality: 'cardinal' | 'fixed' | 'mutable';
    ascendant: ZodiacSign | null;
    midheaven: ZodiacSign | null;
}
export declare class NatalChartData {
    readonly planets: NatalChartDataProps['planets'];
    readonly houses: House[];
    readonly aspects: AspectData[];
    readonly dominantElement: 'fire' | 'earth' | 'air' | 'water';
    readonly dominantModality: 'cardinal' | 'fixed' | 'mutable';
    readonly ascendant: ZodiacSign | null;
    readonly midheaven: ZodiacSign | null;
    private constructor();
    /**
     * Create NatalChartData with validation
     */
    static create(props: NatalChartDataProps): NatalChartData;
    /**
     * Get the "Big Three" (Sun, Moon, Rising)
     */
    getBigThree(): {
        sun: ZodiacSignName;
        moon: ZodiacSignName;
        rising: ZodiacSignName | null;
    };
    /**
     * Get all planets in a specific house
     */
    getPlanetsInHouse(houseNumber: number): PlanetPlacement[];
    /**
     * Get all planets in a specific sign
     */
    getPlanetsInSign(signName: ZodiacSignName): PlanetPlacement[];
    /**
     * Get aspects involving a specific planet
     */
    getAspectsForPlanet(planetName: string): AspectData[];
    /**
     * Check if birth time was known (houses calculated)
     */
    hasHouses(): boolean;
    /**
     * Get a summary string of the chart
     */
    getSummary(): string;
    /**
     * Get elemental balance (count of planets in each element)
     */
    getElementalBalance(): Record<'fire' | 'earth' | 'air' | 'water', number>;
    /**
     * Get modal balance (count of planets in each modality)
     */
    getModalBalance(): Record<'cardinal' | 'fixed' | 'mutable', number>;
    /**
     * Serialize to JSON
     */
    toJSON(): object;
    /**
     * Deserialize from JSON
     */
    static fromJSON(data: any): NatalChartData;
}
//# sourceMappingURL=NatalChartData.d.ts.map