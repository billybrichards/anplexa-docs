/**
 * Base domain error for Cosmic Companion
 */

export class CosmicDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CosmicDomainError';
    Object.setPrototypeOf(this, CosmicDomainError.prototype);
  }
}

export class BirthChartNotFoundError extends CosmicDomainError {
  constructor(identifier: string) {
    super(`Birth chart not found: ${identifier}`);
    this.name = 'BirthChartNotFoundError';
  }
}

export class CompanionNotFoundError extends CosmicDomainError {
  constructor(identifier: string) {
    super(`Companion not found: ${identifier}`);
    this.name = 'CompanionNotFoundError';
  }
}

export class CompanionLimitExceededError extends CosmicDomainError {
  constructor(limit: number) {
    super(`Cannot create more than ${limit} companions on current tier`);
    this.name = 'CompanionLimitExceededError';
  }
}

export class AgeVerificationRequiredError extends CosmicDomainError {
  constructor() {
    super('Age verification required for NSFW content access');
    this.name = 'AgeVerificationRequiredError';
  }
}

export class ContentTierLimitExceededError extends CosmicDomainError {
  constructor(limitType: string) {
    super(`${limitType} limit exceeded for current subscription tier`);
    this.name = 'ContentTierLimitExceededError';
  }
}
