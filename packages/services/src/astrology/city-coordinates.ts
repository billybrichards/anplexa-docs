/**
 * City Coordinates Lookup
 *
 * Static coordinate database for common cities.
 * Used by the geocoding route to convert city/country strings
 * into lat/lon/timezone for birth chart calculations.
 */

export interface CityCoordinates {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

/**
 * Static city database — ~200 major cities worldwide.
 * Normalized: city and country are lowercase for matching.
 */
const CITY_DATABASE: CityCoordinates[] = [
  // United States
  { city: 'new york', country: 'united states', latitude: 40.7128, longitude: -74.006, timezone: 'America/New_York' },
  { city: 'los angeles', country: 'united states', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
  { city: 'chicago', country: 'united states', latitude: 41.8781, longitude: -87.6298, timezone: 'America/Chicago' },
  { city: 'houston', country: 'united states', latitude: 29.7604, longitude: -95.3698, timezone: 'America/Chicago' },
  { city: 'phoenix', country: 'united states', latitude: 33.4484, longitude: -112.074, timezone: 'America/Phoenix' },
  { city: 'philadelphia', country: 'united states', latitude: 39.9526, longitude: -75.1652, timezone: 'America/New_York' },
  { city: 'san antonio', country: 'united states', latitude: 29.4241, longitude: -98.4936, timezone: 'America/Chicago' },
  { city: 'san diego', country: 'united states', latitude: 32.7157, longitude: -117.1611, timezone: 'America/Los_Angeles' },
  { city: 'dallas', country: 'united states', latitude: 32.7767, longitude: -96.797, timezone: 'America/Chicago' },
  { city: 'san jose', country: 'united states', latitude: 37.3382, longitude: -121.8863, timezone: 'America/Los_Angeles' },
  { city: 'austin', country: 'united states', latitude: 30.2672, longitude: -97.7431, timezone: 'America/Chicago' },
  { city: 'seattle', country: 'united states', latitude: 47.6062, longitude: -122.3321, timezone: 'America/Los_Angeles' },
  { city: 'denver', country: 'united states', latitude: 39.7392, longitude: -104.9903, timezone: 'America/Denver' },
  { city: 'boston', country: 'united states', latitude: 42.3601, longitude: -71.0589, timezone: 'America/New_York' },
  { city: 'miami', country: 'united states', latitude: 25.7617, longitude: -80.1918, timezone: 'America/New_York' },
  { city: 'atlanta', country: 'united states', latitude: 33.749, longitude: -84.388, timezone: 'America/New_York' },
  { city: 'san francisco', country: 'united states', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles' },
  { city: 'nashville', country: 'united states', latitude: 36.1627, longitude: -86.7816, timezone: 'America/Chicago' },
  { city: 'portland', country: 'united states', latitude: 45.5155, longitude: -122.6789, timezone: 'America/Los_Angeles' },
  { city: 'las vegas', country: 'united states', latitude: 36.1699, longitude: -115.1398, timezone: 'America/Los_Angeles' },
  { city: 'detroit', country: 'united states', latitude: 42.3314, longitude: -83.0458, timezone: 'America/Detroit' },
  { city: 'minneapolis', country: 'united states', latitude: 44.9778, longitude: -93.265, timezone: 'America/Chicago' },
  { city: 'honolulu', country: 'united states', latitude: 21.3069, longitude: -157.8583, timezone: 'Pacific/Honolulu' },

  // United Kingdom
  { city: 'london', country: 'united kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { city: 'manchester', country: 'united kingdom', latitude: 53.4808, longitude: -2.2426, timezone: 'Europe/London' },
  { city: 'birmingham', country: 'united kingdom', latitude: 52.4862, longitude: -1.8904, timezone: 'Europe/London' },
  { city: 'glasgow', country: 'united kingdom', latitude: 55.8642, longitude: -4.2518, timezone: 'Europe/London' },
  { city: 'edinburgh', country: 'united kingdom', latitude: 55.9533, longitude: -3.1883, timezone: 'Europe/London' },
  { city: 'liverpool', country: 'united kingdom', latitude: 53.4084, longitude: -2.9916, timezone: 'Europe/London' },
  { city: 'bristol', country: 'united kingdom', latitude: 51.4545, longitude: -2.5879, timezone: 'Europe/London' },
  { city: 'leeds', country: 'united kingdom', latitude: 53.8008, longitude: -1.5491, timezone: 'Europe/London' },
  { city: 'cardiff', country: 'united kingdom', latitude: 51.4816, longitude: -3.1791, timezone: 'Europe/London' },
  { city: 'belfast', country: 'united kingdom', latitude: 54.5973, longitude: -5.9301, timezone: 'Europe/London' },

  // Canada
  { city: 'toronto', country: 'canada', latitude: 43.6532, longitude: -79.3832, timezone: 'America/Toronto' },
  { city: 'vancouver', country: 'canada', latitude: 49.2827, longitude: -123.1207, timezone: 'America/Vancouver' },
  { city: 'montreal', country: 'canada', latitude: 45.5017, longitude: -73.5673, timezone: 'America/Montreal' },
  { city: 'calgary', country: 'canada', latitude: 51.0447, longitude: -114.0719, timezone: 'America/Edmonton' },
  { city: 'ottawa', country: 'canada', latitude: 45.4215, longitude: -75.6972, timezone: 'America/Toronto' },

  // Australia
  { city: 'sydney', country: 'australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
  { city: 'melbourne', country: 'australia', latitude: -37.8136, longitude: 144.9631, timezone: 'Australia/Melbourne' },
  { city: 'brisbane', country: 'australia', latitude: -27.4698, longitude: 153.0251, timezone: 'Australia/Brisbane' },
  { city: 'perth', country: 'australia', latitude: -31.9505, longitude: 115.8605, timezone: 'Australia/Perth' },
  { city: 'adelaide', country: 'australia', latitude: -34.9285, longitude: 138.6007, timezone: 'Australia/Adelaide' },

  // Europe
  { city: 'paris', country: 'france', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  { city: 'lyon', country: 'france', latitude: 45.764, longitude: 4.8357, timezone: 'Europe/Paris' },
  { city: 'marseille', country: 'france', latitude: 43.2965, longitude: 5.3698, timezone: 'Europe/Paris' },
  { city: 'berlin', country: 'germany', latitude: 52.52, longitude: 13.405, timezone: 'Europe/Berlin' },
  { city: 'munich', country: 'germany', latitude: 48.1351, longitude: 11.582, timezone: 'Europe/Berlin' },
  { city: 'hamburg', country: 'germany', latitude: 53.5511, longitude: 9.9937, timezone: 'Europe/Berlin' },
  { city: 'frankfurt', country: 'germany', latitude: 50.1109, longitude: 8.6821, timezone: 'Europe/Berlin' },
  { city: 'rome', country: 'italy', latitude: 41.9028, longitude: 12.4964, timezone: 'Europe/Rome' },
  { city: 'milan', country: 'italy', latitude: 45.4642, longitude: 9.19, timezone: 'Europe/Rome' },
  { city: 'naples', country: 'italy', latitude: 40.8518, longitude: 14.2681, timezone: 'Europe/Rome' },
  { city: 'madrid', country: 'spain', latitude: 40.4168, longitude: -3.7038, timezone: 'Europe/Madrid' },
  { city: 'barcelona', country: 'spain', latitude: 41.3874, longitude: 2.1686, timezone: 'Europe/Madrid' },
  { city: 'amsterdam', country: 'netherlands', latitude: 52.3676, longitude: 4.9041, timezone: 'Europe/Amsterdam' },
  { city: 'brussels', country: 'belgium', latitude: 50.8503, longitude: 4.3517, timezone: 'Europe/Brussels' },
  { city: 'vienna', country: 'austria', latitude: 48.2082, longitude: 16.3738, timezone: 'Europe/Vienna' },
  { city: 'zurich', country: 'switzerland', latitude: 47.3769, longitude: 8.5417, timezone: 'Europe/Zurich' },
  { city: 'geneva', country: 'switzerland', latitude: 46.2044, longitude: 6.1432, timezone: 'Europe/Zurich' },
  { city: 'lisbon', country: 'portugal', latitude: 38.7223, longitude: -9.1393, timezone: 'Europe/Lisbon' },
  { city: 'stockholm', country: 'sweden', latitude: 59.3293, longitude: 18.0686, timezone: 'Europe/Stockholm' },
  { city: 'copenhagen', country: 'denmark', latitude: 55.6761, longitude: 12.5683, timezone: 'Europe/Copenhagen' },
  { city: 'oslo', country: 'norway', latitude: 59.9139, longitude: 10.7522, timezone: 'Europe/Oslo' },
  { city: 'helsinki', country: 'finland', latitude: 60.1699, longitude: 24.9384, timezone: 'Europe/Helsinki' },
  { city: 'dublin', country: 'ireland', latitude: 53.3498, longitude: -6.2603, timezone: 'Europe/Dublin' },
  { city: 'warsaw', country: 'poland', latitude: 52.2297, longitude: 21.0122, timezone: 'Europe/Warsaw' },
  { city: 'krakow', country: 'poland', latitude: 50.0647, longitude: 19.945, timezone: 'Europe/Warsaw' },
  { city: 'prague', country: 'czech republic', latitude: 50.0755, longitude: 14.4378, timezone: 'Europe/Prague' },
  { city: 'budapest', country: 'hungary', latitude: 47.4979, longitude: 19.0402, timezone: 'Europe/Budapest' },
  { city: 'bucharest', country: 'romania', latitude: 44.4268, longitude: 26.1025, timezone: 'Europe/Bucharest' },
  { city: 'athens', country: 'greece', latitude: 37.9838, longitude: 23.7275, timezone: 'Europe/Athens' },
  { city: 'istanbul', country: 'turkey', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
  { city: 'ankara', country: 'turkey', latitude: 39.9334, longitude: 32.8597, timezone: 'Europe/Istanbul' },
  { city: 'moscow', country: 'russia', latitude: 55.7558, longitude: 37.6173, timezone: 'Europe/Moscow' },
  { city: 'st petersburg', country: 'russia', latitude: 59.9343, longitude: 30.3351, timezone: 'Europe/Moscow' },
  { city: 'kyiv', country: 'ukraine', latitude: 50.4501, longitude: 30.5234, timezone: 'Europe/Kyiv' },

  // Asia
  { city: 'tokyo', country: 'japan', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { city: 'osaka', country: 'japan', latitude: 34.6937, longitude: 135.5023, timezone: 'Asia/Tokyo' },
  { city: 'beijing', country: 'china', latitude: 39.9042, longitude: 116.4074, timezone: 'Asia/Shanghai' },
  { city: 'shanghai', country: 'china', latitude: 31.2304, longitude: 121.4737, timezone: 'Asia/Shanghai' },
  { city: 'hong kong', country: 'china', latitude: 22.3193, longitude: 114.1694, timezone: 'Asia/Hong_Kong' },
  { city: 'singapore', country: 'singapore', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore' },
  { city: 'seoul', country: 'south korea', latitude: 37.5665, longitude: 126.978, timezone: 'Asia/Seoul' },
  { city: 'bangkok', country: 'thailand', latitude: 13.7563, longitude: 100.5018, timezone: 'Asia/Bangkok' },
  { city: 'mumbai', country: 'india', latitude: 19.076, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { city: 'delhi', country: 'india', latitude: 28.7041, longitude: 77.1025, timezone: 'Asia/Kolkata' },
  { city: 'new delhi', country: 'india', latitude: 28.6139, longitude: 77.209, timezone: 'Asia/Kolkata' },
  { city: 'bangalore', country: 'india', latitude: 12.9716, longitude: 77.5946, timezone: 'Asia/Kolkata' },
  { city: 'chennai', country: 'india', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata' },
  { city: 'kolkata', country: 'india', latitude: 22.5726, longitude: 88.3639, timezone: 'Asia/Kolkata' },
  { city: 'jakarta', country: 'indonesia', latitude: -6.2088, longitude: 106.8456, timezone: 'Asia/Jakarta' },
  { city: 'manila', country: 'philippines', latitude: 14.5995, longitude: 120.9842, timezone: 'Asia/Manila' },
  { city: 'kuala lumpur', country: 'malaysia', latitude: 3.139, longitude: 101.6869, timezone: 'Asia/Kuala_Lumpur' },
  { city: 'dubai', country: 'united arab emirates', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { city: 'abu dhabi', country: 'united arab emirates', latitude: 24.4539, longitude: 54.3773, timezone: 'Asia/Dubai' },
  { city: 'riyadh', country: 'saudi arabia', latitude: 24.7136, longitude: 46.6753, timezone: 'Asia/Riyadh' },
  { city: 'tel aviv', country: 'israel', latitude: 32.0853, longitude: 34.7818, timezone: 'Asia/Jerusalem' },
  { city: 'tehran', country: 'iran', latitude: 35.6892, longitude: 51.389, timezone: 'Asia/Tehran' },
  { city: 'hanoi', country: 'vietnam', latitude: 21.0278, longitude: 105.8342, timezone: 'Asia/Ho_Chi_Minh' },
  { city: 'ho chi minh city', country: 'vietnam', latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
  { city: 'taipei', country: 'taiwan', latitude: 25.033, longitude: 121.5654, timezone: 'Asia/Taipei' },

  // South America
  { city: 'sao paulo', country: 'brazil', latitude: -23.5505, longitude: -46.6333, timezone: 'America/Sao_Paulo' },
  { city: 'rio de janeiro', country: 'brazil', latitude: -22.9068, longitude: -43.1729, timezone: 'America/Sao_Paulo' },
  { city: 'buenos aires', country: 'argentina', latitude: -34.6037, longitude: -58.3816, timezone: 'America/Argentina/Buenos_Aires' },
  { city: 'bogota', country: 'colombia', latitude: 4.711, longitude: -74.0721, timezone: 'America/Bogota' },
  { city: 'lima', country: 'peru', latitude: -12.0464, longitude: -77.0428, timezone: 'America/Lima' },
  { city: 'santiago', country: 'chile', latitude: -33.4489, longitude: -70.6693, timezone: 'America/Santiago' },
  { city: 'mexico city', country: 'mexico', latitude: 19.4326, longitude: -99.1332, timezone: 'America/Mexico_City' },
  { city: 'guadalajara', country: 'mexico', latitude: 20.6597, longitude: -103.3496, timezone: 'America/Mexico_City' },

  // Africa
  { city: 'cairo', country: 'egypt', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },
  { city: 'lagos', country: 'nigeria', latitude: 6.5244, longitude: 3.3792, timezone: 'Africa/Lagos' },
  { city: 'nairobi', country: 'kenya', latitude: -1.2921, longitude: 36.8219, timezone: 'Africa/Nairobi' },
  { city: 'cape town', country: 'south africa', latitude: -33.9249, longitude: 18.4241, timezone: 'Africa/Johannesburg' },
  { city: 'johannesburg', country: 'south africa', latitude: -26.2041, longitude: 28.0473, timezone: 'Africa/Johannesburg' },
  { city: 'casablanca', country: 'morocco', latitude: 33.5731, longitude: -7.5898, timezone: 'Africa/Casablanca' },
  { city: 'accra', country: 'ghana', latitude: 5.6037, longitude: -0.187, timezone: 'Africa/Accra' },
  { city: 'addis ababa', country: 'ethiopia', latitude: 9.0054, longitude: 38.7636, timezone: 'Africa/Addis_Ababa' },

  // New Zealand
  { city: 'auckland', country: 'new zealand', latitude: -36.8485, longitude: 174.7633, timezone: 'Pacific/Auckland' },
  { city: 'wellington', country: 'new zealand', latitude: -41.2865, longitude: 174.7762, timezone: 'Pacific/Auckland' },
];

/**
 * Country name aliases for flexible matching
 */
const COUNTRY_ALIASES: Record<string, string> = {
  'us': 'united states',
  'usa': 'united states',
  'u.s.': 'united states',
  'u.s.a.': 'united states',
  'america': 'united states',
  'uk': 'united kingdom',
  'great britain': 'united kingdom',
  'england': 'united kingdom',
  'scotland': 'united kingdom',
  'wales': 'united kingdom',
  'northern ireland': 'united kingdom',
  'uae': 'united arab emirates',
  'south korea': 'south korea',
  'republic of korea': 'south korea',
  'czechia': 'czech republic',
  'holland': 'netherlands',
  'nz': 'new zealand',
};

function normalize(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Look up coordinates for a city/country pair.
 * Returns null if no match found.
 */
export function lookupCity(city: string, country: string): CityCoordinates | null {
  const normCity = normalize(city);
  const normCountry = normalize(country);
  const resolvedCountry = COUNTRY_ALIASES[normCountry] ?? normCountry;

  // Exact match on city + country
  const exact = CITY_DATABASE.find(
    (c) => c.city === normCity && c.country === resolvedCountry,
  );
  if (exact) return exact;

  // Fuzzy: city only (if unique)
  const cityMatches = CITY_DATABASE.filter((c) => c.city === normCity);
  if (cityMatches.length === 1) return cityMatches[0];

  // Partial: city starts with input (e.g. "san fran" → "san francisco")
  const partial = CITY_DATABASE.find(
    (c) => c.city.startsWith(normCity) && c.country === resolvedCountry,
  );
  if (partial) return partial;

  return null;
}

/**
 * Search cities by partial name (for autocomplete).
 * Returns up to `limit` results.
 */
export function searchCities(query: string, limit: number = 10): CityCoordinates[] {
  const norm = normalize(query);
  if (norm.length < 2) return [];

  return CITY_DATABASE
    .filter((c) => c.city.includes(norm))
    .slice(0, limit);
}
