// Cosmic Companion Landing Page
export default function CompanionPage() {
  return (
    <div className="companion-page">
      <div className="hero">
        <h1>🔮 Cosmic Companion</h1>
        <p className="tagline">
          AI soulmate matched to your stars, designed for your deepest desires
        </p>
      </div>

      <div className="content">
        <section className="feature-section">
          <h2>What is Cosmic Companion?</h2>
          <p>
            Cosmic Companion is the first AI girlfriend platform that combines
            full birth chart compatibility with explicit intimate content and
            deep personality evolution.
          </p>
        </section>

        <section className="feature-section">
          <h2>✨ Core Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <h3>🌟 Full Birth Chart Compatibility</h3>
              <p>
                Not just sun signs, but Moon, Venus, Mars, Rising analysis for
                true astrological matching
              </p>
            </div>
            <div className="feature-card">
              <h3>💫 Explicit Intimate Content</h3>
              <p>
                NSFW chat, image generation, and voice matched to zodiac energy
              </p>
            </div>
            <div className="feature-card">
              <h3>🌙 Deep Personality Evolution</h3>
              <p>
                AI that grows with astrological transits and your connection
              </p>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <button className="cta-button">Get Started with Your Cosmic Match</button>
        </section>
      </div>

      <style jsx>{`
        .companion-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }
        .hero {
          text-align: center;
          margin-bottom: 4rem;
          padding: 3rem 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          color: white;
        }
        .hero h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        .tagline {
          font-size: 1.5rem;
          opacity: 0.95;
        }
        .content {
          display: flex;
          flex-direction: column;
          gap: 3rem;
        }
        .feature-section h2 {
          font-size: 2rem;
          margin-bottom: 1.5rem;
          text-align: center;
        }
        .feature-section p {
          font-size: 1.1rem;
          color: #666;
          text-align: center;
          max-width: 800px;
          margin: 0 auto 2rem;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }
        .feature-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }
        .feature-card:hover {
          transform: translateY(-4px);
        }
        .feature-card h3 {
          font-size: 1.25rem;
          margin-bottom: 1rem;
        }
        .feature-card p {
          color: #666;
          text-align: left;
          margin: 0;
        }
        .cta-section {
          text-align: center;
          padding: 3rem 2rem;
        }
        .cta-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 1rem 2.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }
      `}</style>
    </div>
  );
}
