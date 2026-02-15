'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Starfield } from '@/components/Starfield';
import { CosmicButton } from '@/components/CosmicButton';
import { CosmicCard, CosmicCardBody, CosmicCardFooter } from '@/components/CosmicCard';
import { CosmicInput } from '@/components/CosmicInput';
import { SectionLabel } from '@/components/SectionHeader';
import { StorageService, STORAGE_KEYS, type BirthDataStorage } from '@/lib/storage/StorageService';

interface BirthData {
  date: string;
  time: string;
  timeKnown: boolean;
  city: string;
  country: string;
}

export default function BirthDataForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<BirthData>({
    date: '',
    time: '',
    timeKnown: true,
    city: '',
    country: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BirthData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const handleChange = (field: keyof BirthData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BirthData, string>> = {};

    if (!formData.date) {
      newErrors.date = 'Birth date is required';
    } else {
      const birthDate = new Date(formData.date);
      const today = new Date();
      if (birthDate > today) {
        newErrors.date = 'Birth date cannot be in the future';
      }
      if (birthDate < new Date('1900-01-01')) {
        newErrors.date = 'Birth date must be after 1900';
      }
    }

    if (formData.timeKnown && !formData.time) {
      newErrors.time = 'Please enter birth time or mark as unknown';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Birth city is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Birth country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setGeocodeError(null);

    try {
      // Call geocode API to resolve city/country → lat/lon/tz
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
      const params = new URLSearchParams({ city: formData.city, country: formData.country });
      const response = await fetch(`${apiBase}/api/geocode/lookup?${params}`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setGeocodeError(data.message || `Could not find "${formData.city}, ${formData.country}". Please check spelling.`);
        setIsSubmitting(false);
        return;
      }

      const geo = await response.json();

      // Store birth data with resolved coordinates
      const birthData: BirthDataStorage = {
        userId: 'guest', // Will be replaced with real user ID after auth
        date: formData.date,
        time: formData.timeKnown ? formData.time : '',
        location: {
          name: `${geo.city}, ${geo.country}`,
          latitude: geo.latitude,
          longitude: geo.longitude,
          timezone: geo.timezone,
        },
        timestamp: new Date().toISOString(),
      };

      StorageService.setSessionItem(STORAGE_KEYS.BIRTH_DATA, birthData);
      router.push('/onboarding/calculating');
    } catch (err) {
      console.error('Geocode lookup failed:', err);
      setGeocodeError('Could not look up location. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-deep-space text-cream overflow-hidden flex items-center justify-center px-6 py-12">
      <Starfield />

      <div className="relative z-10 max-w-2xl w-full space-y-8 animate-fade-up">
        <div className="text-center space-y-4">
          <SectionLabel className="animate-fade-in">Step 1 of 5</SectionLabel>

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal leading-tight">
            Your Birth Information
          </h1>

          <p className="text-lg text-text-muted max-w-xl mx-auto">
            Enter your birth details to calculate your complete natal chart
          </p>
        </div>

        <CosmicCard variant="elevated" className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit}>
            <CosmicCardBody className="p-8 space-y-6">
              {/* Birth Date */}
              <CosmicInput
                label="Birth Date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                error={errors.date}
                required
                max={new Date().toISOString().split('T')[0]}
                min="1900-01-01"
              />

              {/* Birth Time Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-sans font-medium tracking-wide uppercase text-text-muted">
                    Birth Time
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!formData.timeKnown}
                      onChange={(e) => {
                        handleChange('timeKnown', !e.target.checked);
                        if (e.target.checked) {
                          handleChange('time', '');
                        }
                      }}
                      className="w-4 h-4 rounded border-gold/20 bg-cosmic-purple/50 text-gold focus:ring-gold focus:ring-offset-0"
                    />
                    <span className="text-sm text-text-muted">Time unknown</span>
                  </label>
                </div>

                {formData.timeKnown && (
                  <CosmicInput
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleChange('time', e.target.value)}
                    error={errors.time}
                    helperText="If known, this enables house calculations for deeper insights"
                  />
                )}

                {!formData.timeKnown && (
                  <div className="bg-cosmic-purple/30 border border-gold/10 rounded-lg p-4">
                    <p className="text-sm text-text-muted">
                      <span className="text-gold">ℹ️</span> Without birth time, we'll calculate
                      your Sun, Moon, and planetary positions. Rising sign and houses require
                      exact time.
                    </p>
                  </div>
                )}
              </div>

              {/* Birth Location */}
              <div className="grid md:grid-cols-2 gap-4">
                <CosmicInput
                  label="Birth City"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  error={errors.city}
                  placeholder="e.g., New York"
                  required
                />

                <CosmicInput
                  label="Birth Country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  error={errors.country}
                  placeholder="e.g., United States"
                  required
                />
              </div>

              {/* Geocode Error */}
              {geocodeError && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4">
                  <p className="text-sm text-red-300">{geocodeError}</p>
                </div>
              )}

              {/* Privacy Notice */}
              <div className="bg-cosmic-purple/50 border border-gold/10 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-gold">🔒</span>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Your birth data is encrypted and stored securely. We use this information
                    only to calculate your natal chart and personalize your AI companion.
                  </p>
                </div>
              </div>
            </CosmicCardBody>

            <CosmicCardFooter className="p-8 pt-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <CosmicButton
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => router.push('/onboarding')}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  ← Back
                </CosmicButton>
                <CosmicButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex-1"
                  loading={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Calculate My Chart'}
                  {!isSubmitting && <span className="ml-2">→</span>}
                </CosmicButton>
              </div>
            </CosmicCardFooter>
          </form>
        </CosmicCard>

        <div className="text-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
          <p className="text-sm text-text-muted">
            Step 1 of 3 • Next: Chart Calculation
          </p>
        </div>
      </div>
    </div>
  );
}
