/**
 * Natal Chart Data Value Object
 *
 * Contains all calculated astrological data for a complete natal chart.
 * Immutable value object representing the state of the cosmos at birth.
 */
import { ZodiacSign } from './ZodiacSign';
export class NatalChartData {
    planets;
    houses;
    aspects;
    dominantElement;
    dominantModality;
    ascendant;
    midheaven;
    constructor(planets, houses, aspects, dominantElement, dominantModality, ascendant, midheaven) {
        this.planets = planets;
        this.houses = houses;
        this.aspects = aspects;
        this.dominantElement = dominantElement;
        this.dominantModality = dominantModality;
        this.ascendant = ascendant;
        this.midheaven = midheaven;
    }
    /**
     * Create NatalChartData with validation
     */
    static create(props) {
        // Validate houses (must be 12 or empty)
        if (props.houses.length !== 0 && props.houses.length !== 12) {
            throw new Error('Houses must be either 12 (time known) or 0 (time unknown)');
        }
        // Validate all planets have valid degrees
        Object.values(props.planets).forEach((planet) => {
            if (planet.degree < 0 || planet.degree >= 360) {
                throw new Error(`${planet.planetName} degree must be between 0 and 360, got ${planet.degree}`);
            }
        });
        return new NatalChartData(props.planets, props.houses, props.aspects, props.dominantElement, props.dominantModality, props.ascendant, props.midheaven);
    }
    /**
     * Get the "Big Three" (Sun, Moon, Rising)
     */
    getBigThree() {
        return {
            sun: this.planets.sun.sign.name,
            moon: this.planets.moon.sign.name,
            rising: this.ascendant?.name ?? null,
        };
    }
    /**
     * Get all planets in a specific house
     */
    getPlanetsInHouse(houseNumber) {
        if (houseNumber < 1 || houseNumber > 12) {
            throw new Error('House number must be between 1 and 12');
        }
        return Object.values(this.planets).filter((planet) => planet.house === houseNumber);
    }
    /**
     * Get all planets in a specific sign
     */
    getPlanetsInSign(signName) {
        return Object.values(this.planets).filter((planet) => planet.sign.name === signName);
    }
    /**
     * Get aspects involving a specific planet
     */
    getAspectsForPlanet(planetName) {
        return this.aspects.filter((aspect) => aspect.planet1 === planetName || aspect.planet2 === planetName);
    }
    /**
     * Check if birth time was known (houses calculated)
     */
    hasHouses() {
        return this.houses.length === 12;
    }
    /**
     * Get a summary string of the chart
     */
    getSummary() {
        const bigThree = this.getBigThree();
        const summary = [
            `Sun in ${bigThree.sun}`,
            `Moon in ${bigThree.moon}`,
        ];
        if (bigThree.rising) {
            summary.push(`Rising in ${bigThree.rising}`);
        }
        summary.push(`Dominant Element: ${this.dominantElement}`);
        summary.push(`Dominant Modality: ${this.dominantModality}`);
        return summary.join(', ');
    }
    /**
     * Get elemental balance (count of planets in each element)
     */
    getElementalBalance() {
        const balance = { fire: 0, earth: 0, air: 0, water: 0 };
        Object.values(this.planets).forEach((planet) => {
            balance[planet.sign.element]++;
        });
        return balance;
    }
    /**
     * Get modal balance (count of planets in each modality)
     */
    getModalBalance() {
        const balance = { cardinal: 0, fixed: 0, mutable: 0 };
        Object.values(this.planets).forEach((planet) => {
            balance[planet.sign.modality]++;
        });
        return balance;
    }
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            planets: Object.fromEntries(Object.entries(this.planets).map(([key, planet]) => [
                key,
                {
                    ...planet,
                    sign: planet.sign.toJSON(),
                },
            ])),
            houses: this.houses.map((house) => ({
                ...house,
                cuspSign: house.cuspSign.toJSON(),
            })),
            aspects: this.aspects,
            dominantElement: this.dominantElement,
            dominantModality: this.dominantModality,
            ascendant: this.ascendant?.toJSON() ?? null,
            midheaven: this.midheaven?.toJSON() ?? null,
        };
    }
    /**
     * Deserialize from JSON
     */
    static fromJSON(data) {
        // Reconstruct planets with ZodiacSign value objects
        const planets = Object.fromEntries(Object.entries(data.planets).map(([key, planetData]) => [
            key,
            {
                ...planetData,
                sign: ZodiacSign.fromJSON(planetData.sign),
            },
        ]));
        // Reconstruct houses
        const houses = data.houses.map((house) => ({
            ...house,
            cuspSign: ZodiacSign.fromJSON(house.cuspSign),
        }));
        return NatalChartData.create({
            planets,
            houses,
            aspects: data.aspects,
            dominantElement: data.dominantElement,
            dominantModality: data.dominantModality,
            ascendant: data.ascendant ? ZodiacSign.fromJSON(data.ascendant) : null,
            midheaven: data.midheaven ? ZodiacSign.fromJSON(data.midheaven) : null,
        });
    }
}
