/**
 * Geocode Routes
 *
 * Converts city/country strings to lat/lon/timezone for birth chart calculation.
 */

import { Router } from 'express';
import { lookupCity, searchCities } from '@anplexa/services/astrology/city-coordinates';
import type { Container } from '../../container.js';

export function createGeocodeRoutes(_container: Container): Router {
  const router = Router();

  /**
   * GET /api/geocode/lookup?city=London&country=UK
   *
   * Returns coordinates + timezone for exact city match.
   */
  router.get('/lookup', (req, res) => {
    const { city, country } = req.query;

    if (!city || typeof city !== 'string') {
      return res.status(400).json({ error: 'city query parameter is required' });
    }
    if (!country || typeof country !== 'string') {
      return res.status(400).json({ error: 'country query parameter is required' });
    }

    const result = lookupCity(city, country);

    if (!result) {
      return res.status(404).json({
        error: 'City not found',
        message: `Could not find coordinates for "${city}, ${country}"`,
      });
    }

    return res.json({
      city: result.city,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone,
    });
  });

  /**
   * GET /api/geocode/search?q=lon&limit=5
   *
   * Returns partial matches for autocomplete.
   */
  router.get('/search', (req, res) => {
    const { q, limit } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'q query parameter is required' });
    }

    const maxResults = limit ? Math.min(parseInt(String(limit), 10) || 10, 50) : 10;
    const results = searchCities(q, maxResults);

    return res.json({ results });
  });

  return router;
}
