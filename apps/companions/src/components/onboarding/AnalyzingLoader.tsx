/**
 * AnalyzingLoader component - displays progress messages during analysis
 */
import React from 'react';

export interface AnalyzingLoaderProps {
  currentStep: number;
  steps: string[];
}

export function AnalyzingLoader({ currentStep, steps }: AnalyzingLoaderProps) {
  return (
    <div className="space-y-4">
      {steps.map((message, index) => (
        <div
          key={index}
          className={`flex items-center gap-3 transition-all duration-300 ${
            index === currentStep
              ? 'opacity-100 scale-100'
              : index < currentStep
              ? 'opacity-60 scale-95'
              : 'opacity-30 scale-90'
          }`}
        >
          {index < currentStep ? (
            <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-deep-space" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          ) : index === currentStep ? (
            <div className="w-5 h-5 rounded-full border-2 border-gold border-t-transparent animate-spin flex-shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full border border-gold/30 flex-shrink-0" />
          )}
          <p className="text-sm text-cream">{message}</p>
        </div>
      ))}
    </div>
  );
}
