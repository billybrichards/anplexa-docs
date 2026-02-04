/**
 * Zodiac Sign Value Object
 *
 * Represents one of the 12 zodiac signs with their elemental and modal properties.
 * Immutable value object following DDD principles.
 */
export type ZodiacSignName = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';
export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';
export declare class ZodiacSign {
    readonly name: ZodiacSignName;
    readonly element: Element;
    readonly modality: Modality;
    readonly rulingPlanet: string;
    readonly degree: number;
    private constructor();
    /**
     * Create a ZodiacSign from absolute ecliptic longitude (0-360 degrees)
     */
    static fromDegree(eclipticLongitude: number): ZodiacSign;
    /**
     * Create a ZodiacSign from a sign name and degree within that sign
     */
    static create(name: ZodiacSignName, degreeInSign?: number): ZodiacSign;
    /**
     * Get the absolute ecliptic longitude (0-360 degrees)
     */
    getEclipticLongitude(): number;
    /**
     * Check if this sign is compatible with another sign by element
     */
    isCompatibleElement(other: ZodiacSign): boolean;
    /**
     * Format the sign as a string for display
     */
    toString(): string;
    /**
     * Format the sign with its symbol
     */
    toSymbol(): string;
    /**
     * Value object equality comparison
     */
    equals(other: ZodiacSign): boolean;
    /**
     * Serialize to JSON
     */
    toJSON(): {
        name: ZodiacSignName;
        degree: number;
    };
    /**
     * Deserialize from JSON
     */
    static fromJSON(data: {
        name: ZodiacSignName;
        degree: number;
    }): ZodiacSign;
}
//# sourceMappingURL=ZodiacSign.d.ts.map