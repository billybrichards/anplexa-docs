/**
 * Simplified Astrology Service
 *
 * Provides basic natal chart calculations using astronomical formulas.
 * This is a working implementation that can be enhanced with Swiss Ephemeris later.
 */
import { NatalChartData } from '@anplexa/core/domain/value-objects/astrology/NatalChartData';
import { ZodiacSign } from '@anplexa/core/domain/value-objects/astrology/ZodiacSign';
export class SimplifiedAstrologyService {
    async isAvailable() {
        return true;
    }
    async calculateNatalChart(birthData, _options = {}) {
        const julianDay = birthData.getJulianDay();
        // Calculate planetary positions
        const positions = this.calculatePlanetaryPositions(julianDay);
        // Build planet placements as an object
        const planets = {
            sun: this.createPlacement('sun', positions.sun),
            moon: this.createPlacement('moon', positions.moon),
            mercury: this.createPlacement('mercury', positions.mercury),
            venus: this.createPlacement('venus', positions.venus),
            mars: this.createPlacement('mars', positions.mars),
            jupiter: this.createPlacement('jupiter', positions.jupiter),
            saturn: this.createPlacement('saturn', positions.saturn),
            uranus: this.createPlacement('uranus', positions.uranus),
            neptune: this.createPlacement('neptune', positions.neptune),
            pluto: this.createPlacement('pluto', positions.pluto),
            northNode: this.createPlacement('northNode', positions.northNode),
            southNode: this.createPlacement('southNode', { longitude: (positions.northNode.longitude + 180) % 360, speed: -positions.northNode.speed }),
        };
        // Calculate houses if birth time is known
        let houses = [];
        let ascendant = null;
        let midheaven = null;
        if (birthData.timeKnown) {
            const houseCusps = this.calculateHouses(julianDay, birthData.latitude, birthData.longitude);
            houses = houseCusps.map((cusp, index) => ({
                number: index + 1,
                cuspDegree: cusp,
                cuspSign: ZodiacSign.fromDegree(cusp),
                planets: [],
            }));
            ascendant = ZodiacSign.fromDegree(houseCusps[0]);
            midheaven = ZodiacSign.fromDegree(houseCusps[9]);
            // Assign planets to houses
            for (const [planetName, planet] of Object.entries(planets)) {
                const houseNumber = this.findHouse(planet.degree, houseCusps);
                planet.house = houseNumber;
                houses[houseNumber - 1].planets.push(planetName);
            }
        }
        // Calculate aspects
        const aspects = this.calculateAspects(planets);
        // Calculate dominants
        const { dominantElement, dominantModality } = this.calculateDominants(planets);
        return NatalChartData.create({
            planets,
            houses,
            aspects,
            dominantElement,
            dominantModality,
            ascendant,
            midheaven,
        });
    }
    createPlacement(planetName, position) {
        const sign = ZodiacSign.fromDegree(position.longitude);
        return {
            planetName,
            sign,
            house: null, // Will be calculated if time known
            degree: position.longitude,
            speed: position.speed,
            isRetrograde: position.speed < 0,
        };
    }
    calculatePlanetaryPositions(julianDay) {
        // Julian centuries from J2000.0
        const T = (julianDay - 2451545.0) / 36525;
        // Simplified mean longitude formulas (good enough for demonstration)
        return {
            sun: {
                longitude: this.normalize(280.46646 + 36000.76983 * T + 0.0003032 * T * T),
                speed: 0.9856,
            },
            moon: {
                longitude: this.normalize(218.316 + 13.176396 * (julianDay - 2451545.0)),
                speed: 13.176,
            },
            mercury: {
                longitude: this.normalize(252.250906 + 149474.07 * T),
                speed: 4.09,
            },
            venus: {
                longitude: this.normalize(181.979801 + 58519.21 * T),
                speed: 1.60,
            },
            mars: {
                longitude: this.normalize(355.433 + 19141.69 * T),
                speed: 0.524,
            },
            jupiter: {
                longitude: this.normalize(34.351519 + 3036.30 * T),
                speed: 0.083,
            },
            saturn: {
                longitude: this.normalize(50.077444 + 1223.51 * T),
                speed: 0.033,
            },
            uranus: {
                longitude: this.normalize(314.055005 + 429.86 * T),
                speed: 0.012,
            },
            neptune: {
                longitude: this.normalize(304.348665 + 219.88 * T),
                speed: 0.006,
            },
            pluto: {
                longitude: this.normalize(238.928973 + 146.58 * T),
                speed: 0.004,
            },
            northNode: {
                longitude: this.normalize(125.0446 - 1934.1362 * T),
                speed: -0.053,
            },
        };
    }
    calculateHouses(julianDay, latitude, _longitude) {
        // Simplified Equal House system from approximate RAMC
        const GMST = 280.46061837 + 360.98564736629 * (julianDay - 2451545.0);
        const ascendant = this.normalize(GMST + latitude);
        // Equal houses: 30 degrees each starting from ascendant
        const houses = [];
        for (let i = 0; i < 12; i++) {
            houses.push(this.normalize(ascendant + i * 30));
        }
        return houses;
    }
    findHouse(degree, cusps) {
        for (let i = 0; i < 12; i++) {
            const nextIndex = (i + 1) % 12;
            const start = cusps[i];
            const end = cusps[nextIndex];
            if (start < end) {
                if (degree >= start && degree < end)
                    return i + 1;
            }
            else {
                // Wraps around 360°
                if (degree >= start || degree < end)
                    return i + 1;
            }
        }
        return 1;
    }
    calculateAspects(planets) {
        const aspects = [];
        const aspectTypes = [
            { name: 'conjunction', angle: 0, orb: 10 },
            { name: 'opposition', angle: 180, orb: 10 },
            { name: 'trine', angle: 120, orb: 8 },
            { name: 'square', angle: 90, orb: 8 },
            { name: 'sextile', angle: 60, orb: 6 },
        ];
        const planetEntries = Object.entries(planets);
        for (let i = 0; i < planetEntries.length; i++) {
            for (let j = i + 1; j < planetEntries.length; j++) {
                const [name1, planet1] = planetEntries[i];
                const [name2, planet2] = planetEntries[j];
                const angle = Math.abs(planet1.degree - planet2.degree);
                const normalizedAngle = angle > 180 ? 360 - angle : angle;
                for (const aspectType of aspectTypes) {
                    const orb = Math.abs(normalizedAngle - aspectType.angle);
                    if (orb <= aspectType.orb) {
                        aspects.push({
                            planet1: name1,
                            planet2: name2,
                            aspectType: aspectType.name,
                            orb,
                            strength: 1 - (orb / aspectType.orb),
                            isApplying: planet1.speed > planet2.speed,
                        });
                        break;
                    }
                }
            }
        }
        return aspects;
    }
    calculateDominants(planets) {
        const elements = { fire: 0, earth: 0, air: 0, water: 0 };
        const modalities = { cardinal: 0, fixed: 0, mutable: 0 };
        for (const planet of Object.values(planets)) {
            elements[planet.sign.element]++;
            modalities[planet.sign.modality]++;
        }
        const dominantElement = Object.entries(elements)
            .sort(([, a], [, b]) => b - a)[0][0];
        const dominantModality = Object.entries(modalities)
            .sort(([, a], [, b]) => b - a)[0][0];
        return { dominantElement, dominantModality };
    }
    normalize(degrees) {
        return ((degrees % 360) + 360) % 360;
    }
    async generateInterpretation(chartData) {
        const big3 = chartData.getBigThree();
        const parts = [];
        parts.push(`## Your Natal Chart Reading\n\n`);
        parts.push(`### The Big Three\n\n`);
        parts.push(`**Sun in ${this.capitalize(big3.sun)}**: Your core identity is ${this.getSignDescription(big3.sun, 'sun')}.\n\n`);
        parts.push(`**Moon in ${this.capitalize(big3.moon)}**: Your emotional nature is ${this.getSignDescription(big3.moon, 'moon')}.\n\n`);
        if (big3.rising) {
            parts.push(`**${this.capitalize(big3.rising)} Rising**: Your outward persona ${this.getSignDescription(big3.rising, 'rising')}.\n\n`);
        }
        parts.push(`### Dominant Patterns\n\n`);
        parts.push(`Your chart is dominated by **${chartData.dominantElement}** energy, making you ${this.getElementDescription(chartData.dominantElement)}.\n\n`);
        parts.push(`Your **${chartData.dominantModality}** modality indicates you are ${this.getModalityDescription(chartData.dominantModality)}.\n`);
        return parts.join('');
    }
    async generateCompanionContext(chartData) {
        const big3 = chartData.getBigThree();
        const parts = [];
        parts.push(`The user has the following astrological profile:\n\n`);
        parts.push(`Sun Sign: ${this.capitalize(big3.sun)} - ${this.getSignDescription(big3.sun, 'sun')}\n`);
        parts.push(`Moon Sign: ${this.capitalize(big3.moon)} - ${this.getSignDescription(big3.moon, 'moon')}\n`);
        if (big3.rising) {
            parts.push(`Rising Sign: ${this.capitalize(big3.rising)} - ${this.getSignDescription(big3.rising, 'rising')}\n`);
        }
        parts.push(`\nDominant Element: ${this.capitalize(chartData.dominantElement)} - ${this.getElementDescription(chartData.dominantElement)}\n`);
        parts.push(`Dominant Modality: ${this.capitalize(chartData.dominantModality)} - ${this.getModalityDescription(chartData.dominantModality)}\n`);
        parts.push(`\nWhen interacting with this user, consider:\n`);
        parts.push(this.getCommunicationGuidance(chartData.dominantElement, big3.moon));
        return parts.join('');
    }
    getSignDescription(sign, placement) {
        const descriptions = {
            aries: { sun: 'courageous and action-oriented', moon: 'emotionally direct and passionate', rising: 'appears confident and assertive' },
            taurus: { sun: 'reliable and grounded', moon: 'emotionally stable and comfort-seeking', rising: 'appears calm and dependable' },
            gemini: { sun: 'curious and adaptable', moon: 'emotionally communicative and versatile', rising: 'appears witty and social' },
            cancer: { sun: 'nurturing and intuitive', moon: 'emotionally sensitive and caring', rising: 'appears warm and protective' },
            leo: { sun: 'creative and charismatic', moon: 'emotionally expressive and generous', rising: 'appears confident and radiant' },
            virgo: { sun: 'analytical and helpful', moon: 'emotionally practical and orderly', rising: 'appears modest and intelligent' },
            libra: { sun: 'diplomatic and relationship-focused', moon: 'emotionally balanced and harmonious', rising: 'appears charming and gracious' },
            scorpio: { sun: 'intense and transformative', moon: 'emotionally profound and private', rising: 'appears mysterious and powerful' },
            sagittarius: { sun: 'optimistic and philosophical', moon: 'emotionally expansive and freedom-loving', rising: 'appears enthusiastic and open-minded' },
            capricorn: { sun: 'ambitious and disciplined', moon: 'emotionally reserved and responsible', rising: 'appears mature and capable' },
            aquarius: { sun: 'innovative and independent', moon: 'emotionally detached and humanitarian', rising: 'appears unique and progressive' },
            pisces: { sun: 'compassionate and imaginative', moon: 'emotionally empathic and spiritual', rising: 'appears dreamy and artistic' },
        };
        return descriptions[sign]?.[placement] ?? 'unique and interesting';
    }
    getElementDescription(element) {
        const descriptions = {
            fire: 'passionate, enthusiastic, and action-driven',
            earth: 'practical, grounded, and materially focused',
            air: 'intellectual, communicative, and idea-oriented',
            water: 'emotional, intuitive, and deeply feeling',
        };
        return descriptions[element] ?? 'unique';
    }
    getModalityDescription(modality) {
        const descriptions = {
            cardinal: 'initiating, leading, and starting new things',
            fixed: 'persistent, stabilizing, and following through',
            mutable: 'adaptable, flexible, and embracing change',
        };
        return descriptions[modality] ?? 'balanced';
    }
    getCommunicationGuidance(element, moonSign) {
        const guidance = [];
        if (element === 'fire') {
            guidance.push('- Match their energy and enthusiasm\n');
            guidance.push('- Be direct and action-oriented\n');
        }
        else if (element === 'earth') {
            guidance.push('- Be practical and provide concrete advice\n');
            guidance.push('- Respect their need for stability\n');
        }
        else if (element === 'air') {
            guidance.push('- Engage intellectually and explore ideas\n');
            guidance.push('- Keep conversations varied and interesting\n');
        }
        else if (element === 'water') {
            guidance.push('- Be emotionally present and empathetic\n');
            guidance.push('- Create a safe space for emotional expression\n');
        }
        guidance.push(`- They need ${this.getMoonSignNeed(moonSign)}\n`);
        return guidance.join('');
    }
    getMoonSignNeed(moonSign) {
        const needs = {
            aries: 'validation for their independence',
            taurus: 'comfort and stability',
            gemini: 'intellectual engagement and variety',
            cancer: 'nurturing and emotional safety',
            leo: 'appreciation and recognition',
            virgo: 'practical support and order',
            libra: 'harmony and balanced perspectives',
            scorpio: 'depth and emotional honesty',
            sagittarius: 'optimism and expansive thinking',
            capricorn: 'respect and practical achievement',
            aquarius: 'space and intellectual connection',
            pisces: 'compassion and creative expression',
        };
        return needs[moonSign] ?? 'understanding';
    }
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}
