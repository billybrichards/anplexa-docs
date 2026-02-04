/**
 * Birth Data Value Object
 *
 * Represents the essential information needed to calculate a natal chart.
 * Immutable value object with built-in validation.
 */
export class BirthData {
    date;
    time;
    timeZone;
    latitude;
    longitude;
    placeName;
    country;
    timeKnown;
    constructor(date, time, timeZone, latitude, longitude, placeName, country, timeKnown) {
        this.date = date;
        this.time = time;
        this.timeZone = timeZone;
        this.latitude = latitude;
        this.longitude = longitude;
        this.placeName = placeName;
        this.country = country;
        this.timeKnown = timeKnown;
    }
    /**
     * Create a BirthData value object with validation
     */
    static create(props) {
        // Validate date
        if (props.date > new Date()) {
            throw new Error('Birth date cannot be in the future');
        }
        if (props.date < new Date('1900-01-01')) {
            throw new Error('Birth date must be after 1900-01-01');
        }
        // Validate time format if known
        if (props.timeKnown && props.time) {
            const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(props.time)) {
                throw new Error('Time must be in HH:MM format (24-hour)');
            }
        }
        // Validate coordinates
        if (props.latitude < -90 || props.latitude > 90) {
            throw new Error('Latitude must be between -90 and 90 degrees');
        }
        if (props.longitude < -180 || props.longitude > 180) {
            throw new Error('Longitude must be between -180 and 180 degrees');
        }
        // Validate place name and country
        if (!props.placeName.trim()) {
            throw new Error('Place name is required');
        }
        if (!props.country.trim()) {
            throw new Error('Country is required');
        }
        // Validate timezone
        if (!props.timeZone.trim()) {
            throw new Error('Timezone is required');
        }
        return new BirthData(props.date, props.time, props.timeZone, props.latitude, props.longitude, props.placeName.trim(), props.country.trim(), props.timeKnown);
    }
    /**
     * Get UTC timestamp combining date and time
     */
    getUTCTimestamp() {
        if (!this.timeKnown) {
            // If time is unknown, use noon UTC as default
            const noonDate = new Date(this.date);
            noonDate.setUTCHours(12, 0, 0, 0);
            return noonDate;
        }
        const [hours, minutes] = this.time.split(':').map(Number);
        const localDate = new Date(this.date);
        localDate.setHours(hours, minutes, 0, 0);
        return localDate;
    }
    /**
     * Get Julian Day Number for astronomical calculations
     */
    getJulianDay() {
        const timestamp = this.getUTCTimestamp();
        const unixTime = timestamp.getTime();
        return unixTime / 86400000 + 2440587.5;
    }
    /**
     * Check if two birth data objects are equal
     */
    equals(other) {
        return (this.date.getTime() === other.date.getTime() &&
            this.time === other.time &&
            this.timeZone === other.timeZone &&
            Math.abs(this.latitude - other.latitude) < 0.0001 &&
            Math.abs(this.longitude - other.longitude) < 0.0001 &&
            this.timeKnown === other.timeKnown);
    }
    /**
     * Format birth data as human-readable string
     */
    toString() {
        const dateStr = this.date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const timeStr = this.timeKnown ? ` at ${this.time}` : '';
        return `${dateStr}${timeStr} in ${this.placeName}, ${this.country}`;
    }
    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            date: this.date.toISOString(),
            time: this.time,
            timeZone: this.timeZone,
            latitude: this.latitude,
            longitude: this.longitude,
            placeName: this.placeName,
            country: this.country,
            timeKnown: this.timeKnown,
        };
    }
    /**
     * Deserialize from JSON
     */
    static fromJSON(data) {
        return BirthData.create({
            date: new Date(data.date),
            time: data.time,
            timeZone: data.timeZone,
            latitude: data.latitude,
            longitude: data.longitude,
            placeName: data.placeName,
            country: data.country,
            timeKnown: data.timeKnown,
        });
    }
}
