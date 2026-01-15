/**
 * GeoLocation Value Object
 *
 * Represents a geographic location used for birth chart calculations.
 * Requires latitude, longitude, and timezone for accurate ephemeris data.
 */

export class GeoLocation {
  private constructor(
    private readonly _latitude: number,
    private readonly _longitude: number,
    private readonly _timezone: string,
    private readonly _city?: string,
    private readonly _country?: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (this._latitude < -90 || this._latitude > 90) {
      throw new Error('Latitude must be between -90 and 90 degrees');
    }
    if (this._longitude < -180 || this._longitude > 180) {
      throw new Error('Longitude must be between -180 and 180 degrees');
    }
    if (!this._timezone) {
      throw new Error('Timezone is required');
    }
  }

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }

  get timezone(): string {
    return this._timezone;
  }

  get city(): string | undefined {
    return this._city;
  }

  get country(): string | undefined {
    return this._country;
  }

  /**
   * Create from coordinates and timezone
   */
  static create(
    latitude: number,
    longitude: number,
    timezone: string,
    city?: string,
    country?: string
  ): GeoLocation {
    return new GeoLocation(latitude, longitude, timezone, city, country);
  }

  /**
   * Format as human-readable string
   */
  toString(): string {
    const parts = [];
    if (this._city) parts.push(this._city);
    if (this._country) parts.push(this._country);
    if (parts.length === 0) {
      return `${this._latitude.toFixed(4)}°, ${this._longitude.toFixed(4)}°`;
    }
    return parts.join(', ');
  }

  toJSON() {
    return {
      latitude: this._latitude,
      longitude: this._longitude,
      timezone: this._timezone,
      city: this._city,
      country: this._country
    };
  }
}
