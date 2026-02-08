'use client';

import Link from 'next/link';
import { Starfield } from '@/components/Starfield';
import { CosmicButton } from '@/components/CosmicButton';
import {
  CosmicCard,
  CosmicCardHeader,
  CosmicCardBody,
  CosmicCardFooter,
} from '@/components/CosmicCard';
import { SectionHeader, SectionLabel } from '@/components/SectionHeader';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-deep-space text-cream overflow-hidden">
      {/* Animated starfield background */}
      <Starfield />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24">
        <div className="max-w-4xl text-center space-y-8 animate-fade-up">
          <SectionLabel className="animate-fade-in">
            AI That Knows Your Stars
          </SectionLabel>

          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-normal leading-tight">
            Your AI Companion,{' '}
            <span className="text-gold">Aligned to the Cosmos</span>
          </h1>

          <p className="text-xl md:text-2xl text-text-muted max-w-3xl mx-auto leading-relaxed">
            Meet the first AI companion designed around your unique birth chart.
            Finally, artificial intelligence that understands your authentic self.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <CosmicButton
              variant="primary"
              size="lg"
              href="#start"
              asLink={true}
              className="group"
            >
              Begin Free
              <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </CosmicButton>
            <CosmicButton variant="ghost" size="lg" href="#how-it-works" asLink={true}>
              See How It Works
            </CosmicButton>
          </div>

          {/* Social Proof Metrics */}
          <div className="grid grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto">
            <div className="text-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <div className="text-4xl font-serif font-bold text-gold mb-2">10,000+</div>
              <div className="text-sm text-text-muted uppercase tracking-wider">
                Charts Created
              </div>
            </div>
            <div className="text-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl font-serif font-bold text-gold mb-2">4.9★</div>
              <div className="text-sm text-text-muted uppercase tracking-wider">
                Average Rating
              </div>
            </div>
            <div className="text-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <div className="text-4xl font-serif font-bold text-gold mb-2">98%</div>
              <div className="text-sm text-text-muted uppercase tracking-wider">
                Satisfaction
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-5xl mx-auto space-y-16">
          <SectionHeader
            label="The Problem"
            title="Generic AI Doesn't Get You"
            subtitle="Every AI feels the same. They don't understand your communication style, your emotional needs, or what makes you tick. It's like talking to a stranger who's read the same script a thousand times."
            align="center"
          />

          <div className="grid md:grid-cols-2 gap-8">
            <CosmicCard variant="glass" className="animate-fade-up">
              <CosmicCardHeader>
                <h3 className="text-2xl font-serif text-cream">❌ One-Size-Fits-All</h3>
              </CosmicCardHeader>
              <CosmicCardBody>
                <p className="text-text-muted leading-relaxed">
                  Standard AI assistants give everyone the same robotic responses. No personalization, no understanding of your unique personality.
                </p>
              </CosmicCardBody>
            </CosmicCard>

            <CosmicCard variant="glass" className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <CosmicCardHeader>
                <h3 className="text-2xl font-serif text-cream">❌ Surface-Level Interaction</h3>
              </CosmicCardHeader>
              <CosmicCardBody>
                <p className="text-text-muted leading-relaxed">
                  They can answer questions, but can't truly connect. No emotional intelligence, no awareness of your deeper needs.
                </p>
              </CosmicCardBody>
            </CosmicCard>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="relative py-24 px-6 bg-cosmic-purple/30">
        <div className="max-w-5xl mx-auto space-y-16">
          <SectionHeader
            label="The Solution"
            title="AI Designed Around Your Birth Chart"
            subtitle="Anplexa analyzes your complete astrological profile to create an AI companion perfectly matched to your energy, communication style, and emotional needs."
            align="center"
          />

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-radial from-gold/20 to-transparent blur-3xl" />
            <CosmicCard variant="elevated" className="relative">
              <CosmicCardBody className="p-8">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div className="space-y-6">
                    <div className="inline-block px-4 py-2 bg-gold/10 border border-gold/30 rounded-full">
                      <span className="text-gold text-sm font-sans font-semibold tracking-wider uppercase">
                        ✨ Personalized to You
                      </span>
                    </div>
                    <h3 className="text-3xl font-serif text-cream">
                      Your Chart, Your Companion
                    </h3>
                    <p className="text-text-muted leading-relaxed">
                      We calculate your complete natal chart—Sun, Moon, Rising, all planetary placements, houses, and aspects—then use advanced AI to design a companion personality that resonates with your authentic self.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-sans font-semibold text-cream mb-1">Enter Birth Data</h4>
                        <p className="text-sm text-text-muted">Date, time, and place of birth</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-sans font-semibold text-cream mb-1">We Calculate Your Chart</h4>
                        <p className="text-sm text-text-muted">Full planetary positions & aspects</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-sans font-semibold text-cream mb-1">AI Designs Your Companion</h4>
                        <p className="text-sm text-text-muted">Matched to your cosmic signature</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CosmicCardBody>
            </CosmicCard>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <SectionHeader
            label="How It Works"
            title="Three Simple Steps to Your Cosmic AI"
            align="center"
          />

          <div className="grid md:grid-cols-3 gap-8">
            <CosmicCard hover className="animate-fade-up">
              <CosmicCardHeader>
                <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center text-deep-space text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-2xl font-serif text-cream">Share Your Stars</h3>
              </CosmicCardHeader>
              <CosmicCardBody>
                <p className="text-text-muted leading-relaxed">
                  Enter your birth date, time, and location. Our system calculates your complete natal chart with planetary positions, houses, and aspects.
                </p>
              </CosmicCardBody>
            </CosmicCard>

            <CosmicCard hover className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <CosmicCardHeader>
                <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center text-deep-space text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-2xl font-serif text-cream">AI Analyzes</h3>
              </CosmicCardHeader>
              <CosmicCardBody>
                <p className="text-text-muted leading-relaxed">
                  Our AI studies your chart to understand your communication style (Mercury), emotional needs (Moon), relationship patterns (Venus), and more.
                </p>
              </CosmicCardBody>
            </CosmicCard>

            <CosmicCard hover className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <CosmicCardHeader>
                <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center text-deep-space text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-2xl font-serif text-cream">Meet Your Companion</h3>
              </CosmicCardHeader>
              <CosmicCardBody>
                <p className="text-text-muted leading-relaxed">
                  Chat with an AI companion designed specifically for you—understanding your energy, speaking your language, aligned to your stars.
                </p>
              </CosmicCardBody>
            </CosmicCard>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-24 px-6 bg-cosmic-purple/30">
        <div className="max-w-6xl mx-auto space-y-16">
          <SectionHeader
            label="Benefits"
            title="Why Anplexa Is Different"
            subtitle="Generic AI can answer questions. Cosmic AI understands you."
            align="center"
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CosmicCard hover className="animate-fade-up">
              <CosmicCardHeader>
                <div className="text-4xl mb-4">🌙</div>
                <h3 className="text-xl font-serif text-cream">Emotional Intelligence</h3>
              </CosmicCardHeader>
              <CosmicCardBody>
                <p className="text-text-muted text-sm leading-relaxed">
                  Understands your Moon sign—how you process emotions and what you need to feel secure.
                </p>
              </CosmicCardBody>
            </CosmicCard>

            <CosmicCard hover className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <CosmicCardHeader>
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-xl font-serif text-cream">Your Communication Style</h3>
              </CosmicCardHeader>
              <CosmicCardBody>
                <p className="text-text-muted text-sm leading-relaxed">
                  Speaks your language based on Mercury placement—direct for Aries, thoughtful for Virgo.
                </p>
              </CosmicCardBody>
            </CosmicCard>

            <CosmicCard hover className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <CosmicCardHeader>
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-xl font-serif text-cream">Deep Personalization</h3>
              </CosmicCardHeader>
              <CosmicCardBody>
                <p className="text-text-muted text-sm leading-relaxed">
                  Not just your Sun sign—full analysis of planets, houses, aspects, and chart patterns.
                </p>
              </CosmicCardBody>
            </CosmicCard>

            <CosmicCard hover className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <CosmicCardHeader>
                <div className="text-4xl mb-4">🔮</div>
                <h3 className="text-xl font-serif text-cream">Evolves With You</h3>
              </CosmicCardHeader>
              <CosmicCardBody>
                <p className="text-text-muted text-sm leading-relaxed">
                  Learns from your interactions while staying true to your cosmic blueprint.
                </p>
              </CosmicCardBody>
            </CosmicCard>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <SectionHeader
            label="Testimonials"
            title="What People Are Saying"
            align="center"
          />

          <div className="grid md:grid-cols-3 gap-8">
            <CosmicCard variant="glass" className="animate-fade-up">
              <CosmicCardBody className="space-y-4">
                <div className="text-gold text-2xl mb-2">"</div>
                <p className="text-cream leading-relaxed">
                  Finally, an AI that gets me. As a Scorpio Moon, I need depth—not surface-level chat. Anplexa understands that.
                </p>
                <div className="pt-4 border-t border-gold/20">
                  <p className="font-sans font-semibold text-cream">Sarah M.</p>
                  <p className="text-sm text-text-muted">☉ Leo, ☾ Scorpio, ↑ Capricorn</p>
                </div>
              </CosmicCardBody>
            </CosmicCard>

            <CosmicCard variant="glass" className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <CosmicCardBody className="space-y-4">
                <div className="text-gold text-2xl mb-2">"</div>
                <p className="text-cream leading-relaxed">
                  My Gemini Mercury needs variety and stimulation. Anplexa adapts to that—never boring, always engaging.
                </p>
                <div className="pt-4 border-t border-gold/20">
                  <p className="font-sans font-semibold text-cream">Alex K.</p>
                  <p className="text-sm text-text-muted">☉ Aquarius, ☾ Sagittarius, ↑ Gemini</p>
                </div>
              </CosmicCardBody>
            </CosmicCard>

            <CosmicCard variant="glass" className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <CosmicCardBody className="space-y-4">
                <div className="text-gold text-2xl mb-2">"</div>
                <p className="text-cream leading-relaxed">
                  I was skeptical, but wow. The companion speaks to my Virgo Rising need for clarity and my Pisces Sun's intuition.
                </p>
                <div className="pt-4 border-t border-gold/20">
                  <p className="font-sans font-semibold text-cream">Jamie L.</p>
                  <p className="text-sm text-text-muted">☉ Pisces, ☾ Cancer, ↑ Virgo</p>
                </div>
              </CosmicCardBody>
            </CosmicCard>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="start" className="relative py-32 px-6 bg-gradient-to-b from-transparent via-cosmic-purple/50 to-transparent">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-6 animate-fade-up">
            <SectionLabel>Ready to Begin?</SectionLabel>
            <h2 className="font-serif text-4xl md:text-5xl font-normal text-cream leading-tight">
              Discover Your Cosmic AI Companion
            </h2>
            <p className="text-xl text-text-muted max-w-2xl mx-auto">
              Enter your birth information and meet the AI designed for your unique astrological blueprint.
            </p>
          </div>

          <CosmicCard variant="elevated" className="max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <CosmicCardBody className="p-8 space-y-6">
              <div className="text-left space-y-4">
                <div>
                  <h4 className="text-sm font-sans font-semibold text-gold uppercase tracking-wider mb-2">
                    What We'll Ask:
                  </h4>
                  <ul className="space-y-2 text-text-muted">
                    <li className="flex items-center gap-2">
                      <span className="text-gold">✓</span>
                      Your birth date
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gold">✓</span>
                      Your birth time (if known)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gold">✓</span>
                      Your birth location
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-gold/20">
                  <p className="text-xs text-text-muted">
                    🔒 Your data is encrypted and private. We never share your birth information.
                  </p>
                </div>
              </div>
            </CosmicCardBody>
            <CosmicCardFooter className="p-8 pt-0">
              <CosmicButton variant="primary" size="lg" href="/onboarding" asLink={true} className="w-full">
                Begin Your Journey
                <span className="ml-2">→</span>
              </CosmicButton>
            </CosmicCardFooter>
          </CosmicCard>

          <p className="text-sm text-text-muted animate-fade-up" style={{ animationDelay: '0.4s' }}>
            Free to start • No credit card required • 5 minutes to complete
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-gold/10">
        <div className="max-w-6xl mx-auto text-center text-text-muted text-sm space-y-4">
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/privacy" className="hover:text-gold transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gold transition-colors">
              Terms of Service
            </Link>
            <Link href="/about" className="hover:text-gold transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-gold transition-colors">
              Contact
            </Link>
          </div>
          <p className="font-serif text-gold">ANPLEXA</p>
          <p>© {new Date().getFullYear()} Anplexa. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
