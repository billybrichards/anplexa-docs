/**
 * FunnelFlow.tsx
 *
 * Main funnel conversion flow component. Manages the quiz, email capture,
 * and checkout experience. Uses custom hooks for session and tracking logic.
 *
 * Reduced from ~450 LOC to ~180 LOC by extracting business logic to hooks.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useFunnelSession, useFunnelTracking } from '../hooks';
import type { FunnelView, Persona } from '../types';

// Dummy data - replace with actual funnel data
const FUNNEL_STEPS = [
  {
    id: 'q1',
    text: 'What brings you here today?',
    options: [
      { text: 'Connection', emoji: '💞' },
      { text: 'Exploration', emoji: '🔍' },
      { text: 'Safety', emoji: '🔒' },
    ],
  },
  {
    id: 'q2',
    text: 'How do you prefer to communicate?',
    options: [
      { text: 'Gentle', emoji: '🌸' },
      { text: 'Direct', emoji: '⚡' },
      { text: 'Structured', emoji: '📋' },
    ],
  },
  {
    id: 'q3',
    text: "What's your ideal pace?",
    options: [
      { text: 'Slow & steady', emoji: '🐢' },
      { text: 'Flexible', emoji: '🌊' },
      { text: 'Fast', emoji: '🚀' },
    ],
  },
];

interface FunnelFlowProps {
  personaId?: Persona;
}

/**
 * FunnelFlow Component
 * Manages the quiz flow and checkout experience with extracted business logic
 */
export function FunnelFlow({ personaId }: FunnelFlowProps) {
  const { persona: paramPersona } = useParams<{ persona?: Persona }>();
  const selectedPersona = personaId || paramPersona;

  // Custom hooks for state management
  const session = useFunnelSession(FUNNEL_STEPS);
  const tracking = useFunnelTracking();

  // Local state for view transitions
  const [view, setView] = useState<FunnelView>('questions');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track step view on mount and step change
  useEffect(() => {
    const currentStep = FUNNEL_STEPS[session.currentStep];
    if (currentStep) {
      tracking.trackStepView(currentStep.id, session.currentStep);
    }
  }, [session.currentStep, tracking]);

  // Track persona selection
  useEffect(() => {
    if (selectedPersona) {
      session.setPersona(selectedPersona);
      tracking.trackPersonaSelection(selectedPersona);
    }
  }, [selectedPersona, session, tracking]);

  /**
   * Handle answer submission
   */
  const handleAnswer = (answer: string) => {
    const currentStep = FUNNEL_STEPS[session.currentStep];

    // Record response and track it
    session.recordResponse(currentStep.id, answer);
    tracking.trackResponse(currentStep.id, answer);

    // Move to next step if available
    if (!session.isLastStep()) {
      session.goNext();
    } else {
      // If last step, move to email capture
      setView('email_capture');
      tracking.trackCompletion(session.responses);
    }
  };

  /**
   * Handle email submission
   */
  const handleEmailSubmit = async (email: string, path: 'free' | 'paid') => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if user already exists
      const exists = await tracking.checkUserExists(email);
      if (exists) {
        setView('already_registered');
        return;
      }

      session.setEmail(email);
      tracking.trackEmailSubmitted(email, path);

      if (path === 'free') {
        // Free path - submit email and show success
        await tracking.submitEmail(email, selectedPersona || 'A');
        setView('success');
      } else {
        // Paid path - redirect to Stripe checkout
        const checkoutUrl = await tracking.createCheckoutSession(
          email,
          process.env.REACT_APP_STRIPE_PRICE_ID || '',
          selectedPersona || 'A'
        );

        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('Email submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset funnel flow
   */
  const handleReset = () => {
    session.resetSession();
    setView('questions');
    setError(null);
  };

  // Render current view
  if (view === 'already_registered') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Already with us!</h2>
          <p className="text-gray-600 mb-6">
            It looks like you're already registered. Please log in to continue.
          </p>
          <a
            href="/login"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (view === 'email_capture') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Join the community</h2>
          <p className="text-gray-600 mb-6">
            Enter your email to get started and choose your plan.
          </p>

          {error && <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded mb-4">{error}</div>}

          <EmailCaptureForm onSubmit={handleEmailSubmit} isLoading={isLoading} />

          <button
            onClick={() => setView('questions')}
            className="w-full mt-4 text-purple-600 hover:text-purple-700 font-semibold py-2"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome!</h2>
          <p className="text-gray-600 mb-6">
            Check your email to confirm your account and get started.
          </p>
          <button
            onClick={handleReset}
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // Default: Quiz questions view
  const currentStep = FUNNEL_STEPS[session.currentStep];
  if (!currentStep) {
    return <div className="text-center p-4">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              Question {session.currentStep + 1} of {session.totalSteps}
            </span>
            <span>{session.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${session.progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">{currentStep.text}</h2>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {currentStep.options?.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(option.text)}
              className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-purple-600 hover:bg-purple-50 transition font-semibold text-gray-900"
            >
              <span className="mr-3">{option.emoji}</span>
              {option.text}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => session.goPrevious()}
            disabled={session.isFirstStep()}
            className="flex-1 py-2 px-4 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
          >
            Back
          </button>
          <button
            onClick={handleReset}
            className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * EmailCaptureForm Component
 */
interface EmailCaptureFormProps {
  onSubmit: (email: string, path: 'free' | 'paid') => void;
  isLoading: boolean;
}

function EmailCaptureForm({ onSubmit, isLoading }: EmailCaptureFormProps) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent, path: 'free' | 'paid') => {
    e.preventDefault();
    if (email.trim()) {
      onSubmit(email, path);
    }
  };

  return (
    <form className="space-y-4">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
        disabled={isLoading}
        required
      />

      <div className="flex gap-3">
        <button
          onClick={(e) => handleSubmit(e, 'free')}
          disabled={isLoading || !email.trim()}
          className="flex-1 py-2 px-4 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition font-semibold"
        >
          {isLoading ? 'Processing...' : 'Free Trial'}
        </button>
        <button
          onClick={(e) => handleSubmit(e, 'paid')}
          disabled={isLoading || !email.trim()}
          className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-semibold"
        >
          {isLoading ? 'Processing...' : 'Subscribe Now'}
        </button>
      </div>
    </form>
  );
}
