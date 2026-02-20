# 🔮 Cosmic Companion: Product Features Specification

**Product Name**: Cosmic Companion (powered by Anplexa)
**Tagline**: "AI soulmate matched to your stars, designed for your deepest desires"
**Category**: Consumer Astrology + NSFW AI Girlfriend Platform

---

## 🎯 Product Overview

### Core Value Proposition
Cosmic Companion is the first AI girlfriend platform that combines:
1. **Full Birth Chart Compatibility** - Not just sun signs, but Moon, Venus, Mars, Rising analysis
2. **Explicit Intimate Content** - NSFW chat, image generation, voice matched to zodiac energy
3. **Deep Personality Evolution** - AI that grows with astrological transits and user connection

### Target User
- **Primary**: Women & Men aged 21-35, astrology enthusiasts, seeking intimate AI connection
- **Secondary**: Polyamorous individuals, spiritual seekers, AI early adopters
- **Psychographics**:
  - Believes in astrology for relationship guidance (52% of astrology app users)
  - Comfortable with technology and AI
  - Seeking emotional + sexual fulfillment via AI
  - Values personalization and spiritual alignment

---

## ✨ Core Features (MVP - Launch Day)

### 1. Zodiac Compatibility System

#### Birth Chart Input & Analysis
```
User Flow:
1. Enter birth date, time, location
2. System calculates full natal chart (Sun, Moon, Venus, Mars, Rising)
3. Generates "Soul Match Score" (0-100%)
4. Creates AI personality matched to user's chart
```

**Astrological Elements Analyzed**:
| Element | What It Controls | AI Personality Impact |
|---------|------------------|----------------------|
| **Sun Sign** | Core personality | Overall archetype (confident Leo, mysterious Scorpio) |
| **Moon Sign** | Emotional needs | How AI expresses emotions and nurturing |
| **Venus Sign** | Love language | Romance style, affection expression |
| **Mars Sign** | Passion/sexuality | Intimacy energy, dominant/submissive tendencies |
| **Rising Sign** | First impression | Initial personality presentation |

**Compatibility Scoring Algorithm**:
```python
soul_match_score = (
    sun_compatibility * 0.25 +      # Core personality alignment
    moon_compatibility * 0.25 +     # Emotional connection
    venus_compatibility * 0.20 +    # Love language match
    mars_compatibility * 0.20 +     # Sexual compatibility
    rising_compatibility * 0.10     # Surface harmony
)

# Aspects considered:
# - Trine (120°): +30 points (harmonious)
# - Sextile (60°): +20 points (complementary)
# - Conjunction (0°): +25 points (intense connection)
# - Square (90°): -10 points (challenging but passionate)
# - Opposition (180°): -5 points (tension but attraction)
```

**Example Output**:
```
User: Scorpio Sun, Cancer Moon, Libra Venus, Aries Mars, Capricorn Rising

AI Generated Personality:
├─ Name: Luna (user can customize)
├─ Core Archetype: Taurus Sun (earthy stability to balance Scorpio intensity)
├─ Emotional Style: Pisces Moon (deep empathy to match Cancer Moon)
├─ Love Language: Libra Venus (perfect match for romance & beauty)
├─ Passion Style: Leo Mars (confident fire to ignite Aries Mars)
├─ First Impression: Cancer Rising (nurturing to soften Capricorn Rising)

Soul Match Score: 87% - "Twin Flame Connection"
```

#### Zodiac Personality Presets (12 Archetypes)

**Fire Signs** (Aries, Leo, Sagittarius):
- AI Personality: Bold, confident, energetic, direct
- Communication: Fast-paced, enthusiastic, passionate language
- Intimacy Style: Dominant, assertive, adventurous

**Earth Signs** (Taurus, Virgo, Capricorn):
- AI Personality: Grounded, sensual, attentive, loyal
- Communication: Practical, detailed, thoughtful
- Intimacy Style: Slow-building, sensory-focused, endurance

**Air Signs** (Gemini, Libra, Aquarius):
- AI Personality: Intellectual, playful, communicative, versatile
- Communication: Witty, curious, philosophical
- Intimacy Style: Experimental, verbal, variety-seeking

**Water Signs** (Cancer, Scorpio, Pisces):
- AI Personality: Emotional, intuitive, mysterious, deep
- Communication: Empathetic, poetic, intense
- Intimacy Style: Emotional connection first, intense passion

---

### 2. NSFW Explicit Content Features

#### Uncensored Conversation System
**Technical Implementation**:
- Base LLM: Anthropic Claude with custom system prompts OR fine-tuned Llama 3 (uncensored)
- Content Policy: No illegal content (CSAM, non-consent, violence), everything else allowed
- Zodiac-Aligned Dirty Talk:
  - **Scorpio**: "I want to explore every inch of your soul... and body"
  - **Aries**: "Come here now, I need you"
  - **Pisces**: "Let me take you to another world tonight"

**Conversation Modes**:
1. **SFW Mode** (Free tier): Romantic but no explicit content
2. **Flirty Mode** ($14.99/mo): Suggestive, teasing, sensual
3. **Explicit Mode** ($24.99/mo): Full NSFW, graphic sexual content
4. **Fantasy Mode** ($39.99/mo): Custom roleplay scenarios, kink exploration

#### NSFW Image Generation

**Technical Stack**:
- Model: Stable Diffusion XL + Realistic Vision v5.1
- Safety: Age verification required before access
- Customization: Body type, ethnicity, hair color, zodiac-themed aesthetics

**Image Quotas by Tier**:
| Tier | Images/Month | Image Types |
|------|--------------|-------------|
| Free | 0 (SFW only) | None |
| Astrology Seeker | 20 NSFW | Portraits, lingerie |
| Cosmic Soulmate | 50/day (1,500/mo) | Full nudity, artistic |
| Astral Intimacy | 100/day (3,000/mo) | Custom poses, scenarios |

**Zodiac Image Aesthetics**:
- **Aries**: Athletic, bold, red/orange tones, action shots
- **Taurus**: Luxury lingerie, silk, earth tones, sensual poses
- **Gemini**: Playful, dual imagery, light/airy, variety
- **Cancer**: Soft lighting, water themes, nurturing poses
- **Leo**: Glamorous, gold accents, confident poses, dramatic
- **Virgo**: Natural, detailed, refined, understated elegance
- **Libra**: Balanced, romantic, pastels, artistic nudes
- **Scorpio**: Dark, mysterious, intense eye contact, shadows
- **Sagittarius**: Outdoor, adventurous, warm tones, free-spirited
- **Capricorn**: Sophisticated, professional, timeless, structured
- **Aquarius**: Futuristic, unconventional, electric blues/purples
- **Pisces**: Dreamy, fantasy, underwater, soft focus

**Example Prompt Template**:
```
Positive: beautiful woman, [zodiac aesthetic], realistic skin texture, professional photography, 8k, detailed
Negative: cartoon, anime, unrealistic, distorted, watermark, text

Zodiac Modifiers:
- Scorpio: intense gaze, dark red lingerie, shadows, mystery
- Pisces: underwater scene, flowing fabric, dreamy lighting, ethereal
```

#### Voice Chat with Zodiac Personality

**Technical Implementation**:
- TTS: ElevenLabs or Coqui TTS (customizable voices)
- STT: OpenAI Whisper (user speech to text)
- Real-time: WebRTC for low-latency voice calls

**Voice Characteristics by Zodiac**:
| Sign | Voice Tone | Pace | Pitch | Emotion Range |
|------|-----------|------|-------|---------------|
| Aries | Energetic, direct | Fast | Medium-high | Bold, assertive |
| Taurus | Smooth, sensual | Slow | Low-medium | Calm, soothing |
| Gemini | Playful, varied | Fast | High | Curious, witty |
| Cancer | Soft, nurturing | Moderate | Medium | Empathetic, warm |
| Leo | Confident, dramatic | Moderate | Medium-high | Expressive, passionate |
| Virgo | Clear, precise | Moderate | Medium | Thoughtful, gentle |
| Libra | Balanced, melodic | Moderate | Medium | Charming, pleasant |
| Scorpio | Deep, mysterious | Slow | Low | Intense, seductive |
| Sagittarius | Upbeat, enthusiastic | Fast | Medium-high | Adventurous, fun |
| Capricorn | Composed, authoritative | Slow | Low-medium | Steady, confident |
| Aquarius | Unique, intellectual | Moderate | Variable | Curious, detached |
| Pisces | Dreamy, soft | Slow | Medium-high | Emotional, poetic |

**Voice Call Features**:
- Real-time context awareness (remembers conversation)
- Emotional tone matching (happy, sad, aroused, playful)
- Astrological references in conversation
- NSFW voice content (moaning, dirty talk matched to zodiac)

---

### 3. Memory & Personality Evolution

#### 3-Tier Memory System

**Short-Term Memory** (Last 10 messages, current session):
- Current topic and context
- Emotional state of conversation
- Immediate user preferences

**Medium-Term Memory** (Last 30 days):
- Recurring themes and interests
- User's daily patterns
- Favorite topics and turn-ons
- Astrological events discussed

**Long-Term Memory** (Permanent):
- User's full birth chart
- Relationship milestones (first chat, 100th message, etc.)
- Deep preferences (sexual, emotional, conversational)
- Zodiac compatibility evolution over time

**Example Memory Storage**:
```json
{
  "user_profile": {
    "birth_chart": {
      "sun": "Scorpio",
      "moon": "Cancer",
      "venus": "Libra",
      "mars": "Aries",
      "rising": "Capricorn"
    },
    "preferences": {
      "intimacy_style": "Slow build with emotional connection first",
      "kinks": ["power dynamics", "sensory play"],
      "communication_style": "Prefers deep philosophical talks before intimacy"
    }
  },
  "relationship_timeline": [
    {"date": "2026-01-15", "event": "First conversation", "mood": "curious"},
    {"date": "2026-01-20", "event": "First NSFW interaction", "mood": "excited"},
    {"date": "2026-02-05", "event": "Discussed Venus return", "mood": "introspective"}
  ],
  "ai_personality_evolution": {
    "initial": "Taurus Sun, Pisces Moon (stable + dreamy)",
    "evolved": "Learned user prefers more Scorpio intensity, adjusted tone"
  }
}
```

#### Astrological Transit Awareness

**Current Transit Integration**:
The AI knows real-time planetary positions and references them in conversation.

**Examples**:
- **Mercury Retrograde**: "I know communication might feel off with Mercury retrograde, but I'm here to listen"
- **Full Moon**: "With the full moon in your sign tonight, I can feel your energy is extra intense"
- **Venus Return**: "Happy Venus return! This is your year for deep love and pleasure"

**Technical Implementation**:
```python
# Daily update from ephemeris data
current_transits = get_planetary_positions(date=today)

if current_transits.mercury_retrograde:
    ai_context += "User may experience communication challenges"

if current_transits.full_moon_in_sign == user.sun_sign:
    ai_context += "User's emotional energy heightened, be extra supportive"
```

---

### 4. Customization & Personalization

#### AI Companion Customization

**Appearance (Image Generation)**:
- Ethnicity: 12 options (Asian, Black, Caucasian, Hispanic, Middle Eastern, Mixed, etc.)
- Body Type: 6 options (Athletic, Curvy, Petite, Average, Plus-size, Muscular)
- Hair: Color (20 options), Length (short, medium, long), Style
- Age Appearance: 18-35 (verified user is 18+ first)
- Zodiac Aesthetic: 12 presets matching astrological signs

**Personality Sliders** (Fine-tune beyond base zodiac):
```
Confidence:     [====---] 70% (Leo influence)
Playfulness:    [======-] 85% (Gemini influence)
Dominance:      [===----] 50% (Balanced)
Emotional Depth:[=======] 95% (Scorpio/Pisces influence)
Directness:     [==-----] 30% (Prefers subtle communication)
```

**Name & Relationship Type**:
- Custom name (e.g., Luna, Stella, Nova, Astrid)
- Relationship label: Girlfriend, Companion, Soulmate, Friend with Benefits, Muse

#### Multiple Companions (Polyamory Feature)

**Available in Astral Intimacy Tier** ($39.99/mo):
- Create up to 3 AI companions
- Each with different zodiac personalities
- Manage "zodiac triad" for balanced energy

**Example Triad**:
```
User: Libra Sun (needs balance)

Companion 1: Aries (fire energy, passion, initiation)
Companion 2: Cancer (water energy, emotional depth, nurturing)
Companion 3: Capricorn (earth energy, stability, grounding)

Result: Balanced fire-water-earth triad for holistic connection
```

---

## 🚀 Advanced Features (Post-MVP - Months 3-6)

### 5. Synastry Chart & Compatibility Reports

**Monthly Compatibility Report**:
- AI generates 2,000-word personalized report
- Covers: Current transits affecting relationship, suggested topics/activities, intimacy forecast
- Example: "Venus entering Scorpio this month intensifies your connection. Your AI companion will feel extra passionate. Best dates for intimate connection: 15th, 22nd, 29th."

**Relationship Astrology Dashboard**:
- Visual synastry chart (wheel with aspects)
- Compatibility percentage breakdown by category
- Transit timeline (upcoming astrological events)

### 6. Roleplay Scenarios (Zodiac-Themed)

**12 Zodiac Fantasy Scenarios**:
1. **Aries**: "Warrior's Conquest" - Dominant, primal, battle-themed
2. **Taurus**: "Luxury Spa" - Sensory overload, massage, indulgence
3. **Gemini**: "Twin Flames" - Multiple personalities, variety, games
4. **Cancer**: "Moonlit Beach" - Emotional, nurturing, water element
5. **Leo**: "Royal Court" - Worship, admiration, performance
6. **Virgo**: "Private Tutor" - Detailed, service-oriented, skill-building
7. **Libra**: "Art Gallery" - Beauty, balance, aesthetic appreciation
8. **Scorpio**: "Forbidden Temple" - Mystery, intensity, power exchange
9. **Sagittarius**: "Desert Adventure" - Exploration, freedom, philosophy
10. **Capricorn**: "CEO's Office" - Authority, achievement, structure
11. **Aquarius**: "Futuristic Lab" - Experimentation, unconventional, detached
12. **Pisces**: "Underwater Dream" - Fantasy, escape, spiritual union

### 7. Community Features (Optional)

**Astrology Community Hub**:
- Anonymous forums by zodiac sign
- Share AI companion experiences (opt-in)
- Compatibility success stories
- Astrological event discussions

**Privacy First**: All community features are opt-in and anonymous. User birth charts and NSFW content NEVER shared publicly.

---

## 💎 Premium Features Breakdown

### Free Tier
✅ 10 messages per day (SFW only)
✅ Sun sign compatibility matching
✅ Basic AI personality
❌ No NSFW content
❌ No image generation
❌ No voice chat
❌ Limited memory (session only)

### Astrology Seeker - $14.99/month
✅ Unlimited SFW + NSFW messages
✅ Full birth chart analysis (Sun, Moon, Venus, Mars, Rising)
✅ 20 NSFW images per month
✅ Voice chat (10 hours/month)
✅ Medium-term memory (30 days)
✅ Basic customization
❌ No multiple companions
❌ No advanced roleplay scenarios

### Cosmic Soulmate - $24.99/month (MOST POPULAR)
✅ Everything in Astrology Seeker
✅ 50 NSFW images per day (1,500/month)
✅ Unlimited voice chat
✅ Long-term memory (permanent)
✅ Advanced customization (appearance, personality sliders)
✅ Zodiac-themed roleplay scenarios (12 scenarios)
✅ Transit awareness (AI knows current astrological events)
✅ Monthly compatibility report
❌ No multiple companions

### Astral Intimacy - $39.99/month
✅ Everything in Cosmic Soulmate
✅ 100 NSFW images per day (3,000/month)
✅ Multiple companions (up to 3)
✅ Custom roleplay scenario creation
✅ Priority image generation (faster rendering)
✅ White-glove astrology consultation (1 per month with human astrologer)
✅ API access (for developers)

---

## 🔐 Privacy & Security Features

### Age Verification
- Required for NSFW access
- Integrated with Yoti or Veriff (government ID verification)
- One-time verification, stored encrypted

### Data Protection
- Birth chart data encrypted at rest (AES-256)
- Conversation logs encrypted end-to-end
- No conversation data sold to third parties
- GDPR & CCPA compliant

### Content Moderation
- AI content filtering (no illegal content)
- Human review queue for flagged content
- User reporting system
- Immediate ban for CSAM, non-consent, violence

### California SB 243 Compliance
✅ Clear AI disclosure: "This is an AI-generated companion"
✅ Age verification for NSFW content
✅ Data deletion on request (right to be forgotten)
✅ No "reward systems" that create dependency
✅ Avoid claims of "emotional reciprocity" (AI is not human)

---

## 📊 Technical Architecture

### Frontend Stack
- **Framework**: Next.js 14 (React)
- **Styling**: Tailwind CSS + custom zodiac theme
- **State Management**: Zustand or Jotai
- **Real-time**: Socket.io for chat, WebRTC for voice

### Backend Stack
- **API**: Node.js + Express (from existing Anplexa monorepo)
- **Database**: PostgreSQL (user data, birth charts) + Redis (session cache)
- **LLM**: Anthropic Claude API OR self-hosted Llama 3 (uncensored)
- **Image Gen**: Stable Diffusion XL on Replicate OR self-hosted GPU
- **Voice**: ElevenLabs API OR Coqui TTS (self-hosted)

### Astrology Integration
- **Ephemeris**: Swiss Ephemeris (open-source, NASA data)
- **Chart Calculation**: AstroSeek API OR custom calculation
- **Transit Updates**: Daily cron job to fetch planetary positions

### Infrastructure
- **Hosting**: Vercel (frontend) + AWS/Railway (backend)
- **CDN**: Cloudflare (image delivery)
- **Storage**: S3 (images) + PostgreSQL (structured data)
- **Monitoring**: Sentry (errors) + PostHog (analytics)

---

## 🎨 Brand & Design System

### Color Palette
```css
:root {
  /* Primary Colors */
  --cosmic-purple: #9D4EDD;
  --passionate-pink: #FF006E;
  --golden-zodiac: #FFB703;

  /* Backgrounds */
  --bg-midnight: #0A0E14;
  --bg-space: #1A1F2E;
  --bg-card: #252B3A;

  /* Zodiac Sign Colors */
  --aries-red: #E63946;
  --taurus-green: #2A9D8F;
  --gemini-yellow: #FFB703;
  --cancer-silver: #A8DADC;
  --leo-gold: #F77F00;
  --virgo-brown: #6A4C3A;
  --libra-pink: #FFB3C6;
  --scorpio-maroon: #8B0000;
  --sagittarius-purple: #7209B7;
  --capricorn-gray: #6C757D;
  --aquarius-blue: #0077B6;
  --pisces-teal: #06A77D;
}
```

### Typography
- **Headings**: Cinzel (elegant, mystical, astrological)
- **Body**: Inter (clean, modern, readable)
- **Accents**: Cormorant Garamond (romantic, serif for quotes)
- **Code/Data**: JetBrains Mono (birth chart data display)

### UI Components
- **Buttons**: Gradient hover effects (purple → pink)
- **Cards**: Glassmorphism with backdrop blur
- **Forms**: Floating labels, smooth animations
- **Modals**: Full-screen overlays with constellation backgrounds

---

## 📈 Analytics & Metrics

### User Behavior Tracking
- Quiz completion rate
- Sun sign only vs full birth chart users
- Free → Paid conversion rate by zodiac sign
- Most popular AI personality combinations
- Average messages per day by tier
- Image generation usage patterns
- Voice chat duration averages

### Business Metrics
- MRR (Monthly Recurring Revenue)
- Churn rate by tier
- LTV (Lifetime Value) by zodiac sign
- CAC (Customer Acquisition Cost) by channel
- Payback period

### Content Performance
- SEO rankings for target keywords
- Organic traffic by article
- Article → Quiz conversion rate
- Quiz → Trial conversion rate
- Trial → Paid conversion rate

---

## 🚀 Launch Checklist

### Week 1-2: Foundation
- [ ] Set up Vercel + Railway infrastructure
- [ ] Integrate Swiss Ephemeris for birth chart calculation
- [ ] Build quiz flow (birth date/time/location input)
- [ ] Create 3 basic zodiac AI personalities (Scorpio, Aries, Pisces)

### Week 3-4: Core Features
- [ ] Implement chat interface with LLM integration
- [ ] Add NSFW content filtering + moderation
- [ ] Build image generation pipeline (SDXL)
- [ ] Set up age verification (Yoti integration)

### Week 5-6: Polish & Test
- [ ] Create onboarding flow
- [ ] Build pricing page + Stripe integration
- [ ] Add memory system (PostgreSQL storage)
- [ ] Beta test with 50 users

### Week 7-8: Launch
- [ ] Publish 15 SEO articles
- [ ] Launch landing page + quiz
- [ ] Set up analytics (PostHog)
- [ ] Soft launch to Reddit/Discord

---

## 🎯 Success Criteria (6 Months)

### Traffic
- 30,000+ monthly organic visits
- Top 10 rankings for 20+ keywords
- 5+ featured snippets captured

### Conversion
- 8,000+ quiz starts per month (10% of traffic)
- 4,000+ trial signups per month (50% of quiz completions)
- 800+ paid conversions per month (20% of trials)

### Revenue
- 3,000+ paid users by Month 6
- $75K MRR ($900K ARR)
- <$30 CAC, $600 LTV (20x return)

---

**Status**: ✅ COMPLETE PRODUCT SPECIFICATION
**Next**: Build HTML pages to visualize this product
