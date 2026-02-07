/**
 * Birth Chart Entity (Aggregate Root)
 *
 * Represents a calculated natal chart for a user.
 * Contains both the input data (BirthData) and calculated results (NatalChartData).
 * Immutable once created - charts are snapshots in time.
 */

import { BirthData, type BirthDataProps } from '../value-objects/astrology/BirthData.js';
import { NatalChartData, type NatalChartDataProps } from '../value-objects/astrology/NatalChartData.js';

export interface BirthChartProps {
  id: string;
  userId: string;
  birthData: BirthData;
  chartData: NatalChartData;
  displayName: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class BirthChart {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly birthData: BirthData,
    public readonly chartData: NatalChartData,
    public readonly displayName: string | null,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Create a new BirthChart entity
   */
  static create(
    id: string,
    userId: string,
    birthData: BirthData,
    chartData: NatalChartData,
    displayName?: string
  ): BirthChart {
    if (!id || id.trim().length === 0) {
      throw new Error('Birth chart ID is required');
    }
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    const now = new Date();

    return new BirthChart(
      id,
      userId,
      birthData,
      chartData,
      displayName ?? null,
      true, // New charts are active by default
      now,
      now
    );
  }

  /**
   * Reconstruct from persistence (for repository)
   */
  static fromPersistence(props: BirthChartProps): BirthChart {
    return new BirthChart(
      props.id,
      props.userId,
      props.birthData,
      props.chartData,
      props.displayName,
      props.isActive,
      props.createdAt,
      props.updatedAt
    );
  }

  /**
   * Deactivate this chart (when user activates a different one)
   */
  deactivate(): BirthChart {
    if (!this.isActive) {
      return this; // Already inactive
    }

    return new BirthChart(
      this.id,
      this.userId,
      this.birthData,
      this.chartData,
      this.displayName,
      false,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Activate this chart
   */
  activate(): BirthChart {
    if (this.isActive) {
      return this; // Already active
    }

    return new BirthChart(
      this.id,
      this.userId,
      this.birthData,
      this.chartData,
      this.displayName,
      true,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Update display name
   */
  updateDisplayName(newName: string): BirthChart {
    if (newName.trim().length === 0) {
      throw new Error('Display name cannot be empty');
    }

    return new BirthChart(
      this.id,
      this.userId,
      this.birthData,
      this.chartData,
      newName.trim(),
      this.isActive,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Get a summary of the birth chart
   */
  getSummary(): string {
    const location = `${this.birthData.placeName}, ${this.birthData.country}`;
    const date = this.birthData.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const bigThree = this.chartData.getBigThree();

    return `Born ${date} in ${location}. Sun: ${bigThree.sun}, Moon: ${bigThree.moon}${
      bigThree.rising ? `, Rising: ${bigThree.rising}` : ''
    }`;
  }

  /**
   * Check if another birth chart has identical birth data
   */
  hasSameBirthData(other: BirthChart): boolean {
    return this.birthData.equals(other.birthData);
  }

  /**
   * Entity equality (by ID)
   */
  equals(other: BirthChart): boolean {
    return this.id === other.id;
  }

  /**
   * Serialize to JSON for persistence
   */
  toJSON(): {
    id: string;
    userId: string;
    birthData: ReturnType<BirthData['toJSON']>;
    chartData: ReturnType<NatalChartData['toJSON']>;
    displayName: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: this.id,
      userId: this.userId,
      birthData: this.birthData.toJSON(),
      chartData: this.chartData.toJSON() as any,
      displayName: this.displayName,
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * Deserialize from JSON
   */
  static fromJSON(data: {
    id: string;
    userId: string;
    birthData: Parameters<typeof BirthData.fromJSON>[0];
    chartData: any;
    displayName: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  }): BirthChart {
    return BirthChart.fromPersistence({
      id: data.id,
      userId: data.userId,
      birthData: BirthData.fromJSON(data.birthData),
      chartData: NatalChartData.fromJSON(data.chartData),
      displayName: data.displayName,
      isActive: data.isActive,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }
}
