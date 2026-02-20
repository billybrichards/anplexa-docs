/**
 * Funnel Application Types
 */

export type FunnelView =
  | 'questions'
  | 'email_capture'
  | 'success'
  | 'already_registered';

export type Persona = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface FunnelQuestion {
  id: string;
  text: string;
  options: {
    text: string;
    emoji: string;
  }[];
}

export interface FunnelPersona {
  id: Persona;
  title: string;
  subtitle: string;
  emoji: string;
  questions: FunnelQuestion[];
  profile: PersonalityProfile;
}

export interface PersonalityProfile {
  primaryNeed: string;
  communicationStyle: string;
  pace: string;
  tags: string[];
}

export interface FunnelResponse {
  sessionId: string;
  persona: Persona;
  email: string;
  responses: Record<string, string>;
  path: 'free' | 'paid';
  priceId?: string;
  stripeSessionId?: string;
}

export interface FunnelStep {
  id: string;
  question: string;
  options?: string[];
}

export interface FunnelSessionState {
  currentStep: number;
  totalSteps: number;
  progress: number;
  responses: Record<string, string>;
  persona?: Persona;
  email?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  interval: 'month' | 'year';
  stripeId: string;
  features: string[];
}
