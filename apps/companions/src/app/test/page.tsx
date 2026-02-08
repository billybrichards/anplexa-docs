'use client';

import React, { useState } from 'react';
import { ChatInterface } from '../../components/ChatInterface';

type TestView = 'overview' | 'chat' | 'funnel-info';

/**
 * Test page for exploring and testing the astrology chatbot components
 *
 * This page provides:
 * - Overview of the system architecture
 * - Live ChatInterface component for testing
 * - Information about the onboarding funnel
 * - Links to relevant files for developers
 */
export default function TestPage() {
  const [activeView, setActiveView] = useState<TestView>('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔮 Astrology Chatbot Test Environment
          </h1>
          <p className="text-gray-600">
            Explore and test the Cosmic Companion onboarding and chat interface
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeView === 'overview'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 Overview
            </button>
            <button
              onClick={() => setActiveView('chat')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeView === 'chat'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              💬 Chat Interface
            </button>
            <button
              onClick={() => setActiveView('funnel-info')}
              className={`px-4 py-3 font-medium border-b-2 transition ${
                activeView === 'funnel-info'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🎯 Onboarding Funnel
            </button>
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeView === 'overview' && <OverviewView />}
        {activeView === 'chat' && <ChatView />}
        {activeView === 'funnel-info' && <FunnelInfoView />}
      </div>
    </div>
  );
}

/**
 * Overview view showing system architecture and components
 */
function OverviewView() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">System Architecture</h2>
        <p className="text-gray-600 mb-4">
          The Astrology Chatbot system consists of two main applications working together:
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="border-2 border-purple-200 rounded-lg p-4">
            <h3 className="text-lg font-bold text-purple-600 mb-2">🎯 Funnel App</h3>
            <p className="text-sm text-gray-600 mb-3">
              Handles user acquisition and onboarding with a quiz-based approach.
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 3-step personality quiz</li>
              <li>• Email capture</li>
              <li>• Stripe integration</li>
              <li>• Conversion tracking</li>
            </ul>
          </div>

          <div className="border-2 border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-bold text-blue-600 mb-2">💬 Companions App</h3>
            <p className="text-sm text-gray-600 mb-3">
              Delivers the AI chat experience with preference management.
            </p>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Guest mode (6 messages)</li>
              <li>• Authenticated mode (10+ messages)</li>
              <li>• Customizable preferences</li>
              <li>• Upgrade prompts</li>
            </ul>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-bold text-gray-900 mb-2">🌟 Key Features</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-semibold text-purple-600 mb-1">Astrology Integration</div>
              <p className="text-gray-600">
                Birth chart compatibility with weighted scoring (Sun 25%, Moon 25%, Venus 20%,
                Mars 20%, Rising 10%)
              </p>
            </div>
            <div>
              <div className="font-semibold text-purple-600 mb-1">Tiered Access</div>
              <p className="text-gray-600">
                Guest mode → Free tier → Paid tier with progressive feature unlocking
              </p>
            </div>
            <div>
              <div className="font-semibold text-purple-600 mb-1">Clean Architecture</div>
              <p className="text-gray-600">
                Separation of concerns with hooks, domain logic, and UI components
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">File Locations</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Companions App (Chat Interface)</h3>
            <div className="bg-gray-50 rounded p-3 font-mono text-sm space-y-1">
              <div>
                <span className="text-purple-600">Component:</span>{' '}
                apps/companions/src/components/ChatInterface.tsx
              </div>
              <div>
                <span className="text-purple-600">Hooks:</span>{' '}
                apps/companions/src/hooks/
              </div>
              <div className="pl-4 text-gray-600">
                • useGuestChat.ts - Guest mode management
              </div>
              <div className="pl-4 text-gray-600">
                • usePreferences.ts - User preferences
              </div>
              <div className="pl-4 text-gray-600">
                • useUpgradeModal.ts - Conversion prompts
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Funnel App (Onboarding)</h3>
            <div className="bg-gray-50 rounded p-3 font-mono text-sm space-y-1">
              <div>
                <span className="text-purple-600">Component:</span>{' '}
                apps/funnel/client/src/pages/FunnelFlow.tsx
              </div>
              <div>
                <span className="text-purple-600">Hooks:</span>{' '}
                apps/funnel/client/src/hooks/
              </div>
              <div className="pl-4 text-gray-600">
                • useFunnelSession.ts - Quiz state management
              </div>
              <div className="pl-4 text-gray-600">
                • useFunnelTracking.ts - Analytics tracking
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Testing Guide</h2>
        <div className="space-y-3 text-gray-700">
          <div className="flex items-start gap-3">
            <span className="text-2xl">1️⃣</span>
            <div>
              <div className="font-semibold">Test the Chat Interface</div>
              <p className="text-sm text-gray-600">
                Click the "Chat Interface" tab above to interact with the live ChatInterface
                component. Test preferences, message limits, and upgrade prompts.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">2️⃣</span>
            <div>
              <div className="font-semibold">Explore Onboarding Info</div>
              <p className="text-sm text-gray-600">
                Click the "Onboarding Funnel" tab to learn about the quiz flow and see how to
                run the funnel app independently.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">3️⃣</span>
            <div>
              <div className="font-semibold">Check localStorage</div>
              <p className="text-sm text-gray-600">
                Open browser DevTools → Application → Local Storage to see persisted data for
                guest messages and preferences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Chat view with live ChatInterface component
 */
function ChatView() {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 mb-2">💡 Testing Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Try sending 10+ messages to trigger the upgrade modal</li>
          <li>• Modify preferences and refresh to test localStorage persistence</li>
          <li>• Check the message counter at the bottom of the chat</li>
          <li>• Test the "Reset Preferences" button</li>
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: 'calc(100vh - 300px)' }}>
        <ChatInterface />
      </div>
    </div>
  );
}

/**
 * Funnel info view with instructions and details
 */
function FunnelInfoView() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 Onboarding Funnel</h2>
        <p className="text-gray-600 mb-4">
          The onboarding funnel is a separate Vite application that captures leads through a
          3-step quiz experience.
        </p>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Quiz Flow</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <div className="font-semibold text-gray-900">What brings you here today?</div>
                <div className="text-sm text-gray-600">
                  💞 Connection | 🔍 Exploration | 🔒 Safety
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <div className="font-semibold text-gray-900">How do you prefer to communicate?</div>
                <div className="text-sm text-gray-600">
                  🌸 Gentle | ⚡ Direct | 📋 Structured
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <div className="font-semibold text-gray-900">What's your ideal pace?</div>
                <div className="text-sm text-gray-600">
                  🐢 Slow & steady | 🌊 Flexible | 🚀 Fast
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 mb-2">After Quiz Completion</h3>
            <ul className="text-gray-700 space-y-2 ml-4">
              <li>✉️ Email capture form</li>
              <li>💳 Choice between "Free Trial" and "Subscribe Now"</li>
              <li>🎉 Success screen with email confirmation message</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-900 mb-2">Running the Funnel App</h3>
            <div className="font-mono text-sm space-y-2">
              <div className="text-gray-600"># Navigate to funnel directory</div>
              <div className="bg-white p-2 rounded">cd apps/funnel/client</div>
              <div className="text-gray-600 mt-3"># Install dependencies</div>
              <div className="bg-white p-2 rounded">npm install</div>
              <div className="text-gray-600 mt-3"># Start development server</div>
              <div className="bg-white p-2 rounded">npm run dev</div>
              <div className="text-gray-600 mt-3"># Access at</div>
              <div className="bg-white p-2 rounded">http://localhost:5173</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Technical Details</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">State Management</h3>
            <p className="text-gray-600 text-sm mb-2">
              The funnel uses custom hooks for clean separation of concerns:
            </p>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>
                <span className="font-mono text-purple-600">useFunnelSession</span> - Manages quiz
                progression, responses, and navigation
              </li>
              <li>
                <span className="font-mono text-purple-600">useFunnelTracking</span> - Handles
                analytics events and API submissions
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Integration Points</h3>
            <ul className="text-sm text-gray-700 space-y-1 ml-4">
              <li>🔌 Stripe Checkout API for paid subscriptions</li>
              <li>📧 Email validation and duplicate checking</li>
              <li>📊 Analytics tracking at each step</li>
              <li>🔗 Redirect to chat interface after completion</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-bold text-yellow-900 mb-2">⚠️ Note</h3>
            <p className="text-sm text-yellow-800">
              The funnel app is a separate Vite application and requires its own dev server. It
              cannot be directly embedded in this Next.js app without building it as a library or
              using iframe embedding.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
