/**
 * Birth Data Value Object
 *
 * Represents the essential information needed to calculate a natal chart.
 * Immutable value object with built-in validation.
 */
export interface BirthDataProps {
    date: Date;
    time: string;
    timeZone: string;
    latitude: number;
    longitude: number;
    placeName: string;
    country: string;
    timeKnown: boolean;
}
export declare class BirthData {
    readonly date: Date;
    readonly time: string;
    readonly timeZone: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly placeName: string;
    readonly country: string;
    readonly timeKnown: boolean;
    private constructor();
    /**
     * Create a BirthData value object with validation
     */
    static create(props: BirthDataProps): BirthData;
    /**
     * Get UTC timestamp combining date and time
     */
    getUTCTimestamp(): Date;
    /**
     * Get Julian Day Number for astronomical calculations
     */
    getJulianDay(): number;
    /**
     * Check if two birth data objects are equal
     */
    equals(other: BirthData): boolean;
    /**
     * Format birth data as human-readable string
     */
    toString(): string;
    /**
     * Serialize to JSON
     */
    toJSON(): {
        date: string;
        time: string;
        timeZone: string;
        latitude: number;
        longitude: number;
        placeName: string;
        country: string;
        timeKnown: boolean;
    };
    /**
     * Deserialize from JSON
     */
    static fromJSON(data: {
        date: string;
        time: string;
        timeZone: string;
        latitude: number;
        longitude: number;
        placeName: string;
        country: string;
        timeKnown: boolean;
    }): BirthData;
}
//# sourceMappingURL=BirthData.d.ts.map