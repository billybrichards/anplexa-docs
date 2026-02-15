import { describe, it, expect } from 'vitest';
import { lookupCity, searchCities } from '../city-coordinates.js';

describe('city-coordinates', () => {
  describe('lookupCity', () => {
    it('should find exact match by city and country', () => {
      const result = lookupCity('London', 'United Kingdom');
      expect(result).not.toBeNull();
      expect(result!.latitude).toBeCloseTo(51.5074, 2);
      expect(result!.longitude).toBeCloseTo(-0.1278, 2);
      expect(result!.timezone).toBe('Europe/London');
    });

    it('should be case-insensitive', () => {
      const result = lookupCity('NEW YORK', 'united states');
      expect(result).not.toBeNull();
      expect(result!.timezone).toBe('America/New_York');
    });

    it('should resolve country aliases (US → United States)', () => {
      const result = lookupCity('Chicago', 'US');
      expect(result).not.toBeNull();
      expect(result!.timezone).toBe('America/Chicago');
    });

    it('should resolve country aliases (UK → United Kingdom)', () => {
      const result = lookupCity('Manchester', 'UK');
      expect(result).not.toBeNull();
      expect(result!.timezone).toBe('Europe/London');
    });

    it('should return unique city without country match', () => {
      // Tokyo is unique — only one entry
      const result = lookupCity('Tokyo', 'wrong country');
      expect(result).not.toBeNull();
      expect(result!.timezone).toBe('Asia/Tokyo');
    });

    it('should match partial city names with correct country', () => {
      const result = lookupCity('san fran', 'United States');
      expect(result).not.toBeNull();
      expect(result!.city).toBe('san francisco');
    });

    it('should return null for unknown city', () => {
      const result = lookupCity('Nowheresville', 'United States');
      expect(result).toBeNull();
    });

    it('should handle extra whitespace', () => {
      const result = lookupCity('  Paris  ', '  France  ');
      expect(result).not.toBeNull();
      expect(result!.timezone).toBe('Europe/Paris');
    });

    it('should find cities in various continents', () => {
      expect(lookupCity('Sydney', 'Australia')).not.toBeNull();
      expect(lookupCity('Cairo', 'Egypt')).not.toBeNull();
      expect(lookupCity('Tokyo', 'Japan')).not.toBeNull();
      expect(lookupCity('Sao Paulo', 'Brazil')).not.toBeNull();
      expect(lookupCity('Auckland', 'New Zealand')).not.toBeNull();
    });

    it('should find cities with multi-word names', () => {
      const result = lookupCity('Ho Chi Minh City', 'Vietnam');
      expect(result).not.toBeNull();
      expect(result!.timezone).toBe('Asia/Ho_Chi_Minh');
    });
  });

  describe('searchCities', () => {
    it('should return matching cities by partial name', () => {
      const results = searchCities('lon');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((c) => c.city === 'london')).toBe(true);
    });

    it('should respect limit parameter', () => {
      const results = searchCities('san', 2);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('should return empty for very short queries', () => {
      const results = searchCities('a');
      expect(results).toEqual([]);
    });

    it('should return empty for no matches', () => {
      const results = searchCities('zzzzzzz');
      expect(results).toEqual([]);
    });

    it('should find multiple matches for common prefixes', () => {
      const results = searchCities('san', 10);
      expect(results.length).toBeGreaterThanOrEqual(3); // san francisco, san diego, san jose, san antonio
    });
  });
});
