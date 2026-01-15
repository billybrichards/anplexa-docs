'use client';

// Anplexa Companions - Next.js App
import Link from 'next/link';

export default function Home() {
  return (
    <div className="home-container">
      <div className="hero">
        <h1>Welcome to Anplexa</h1>
        <p className="tagline">AI-Powered Solutions for Everyone</p>
      </div>

      <div className="links-grid">
        <Link href="/companion" className="page-card">
          <h2>🔮 Cosmic Companion</h2>
          <p>
            AI soulmate matched to your stars, designed for your deepest desires
          </p>
          <span className="cta">Explore Companion →</span>
        </Link>

        <Link href="/business" className="page-card">
          <h2>💼 Business Solutions</h2>
          <p>
            Enterprise AI tools and consulting services for modern businesses
          </p>
          <span className="cta">Explore Business →</span>
        </Link>
      </div>

      <style jsx>{`
        .home-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }
        .hero {
          text-align: center;
          margin-bottom: 4rem;
        }
        .hero h1 {
          font-size: 3rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 1rem;
        }
        .tagline {
          font-size: 1.25rem;
          color: #666;
        }
        .links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }
        .page-card {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          text-decoration: none;
          color: inherit;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .page-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        .page-card h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
        }
        .page-card p {
          color: #666;
          flex: 1;
        }
        .cta {
          color: #667eea;
          font-weight: 600;
          align-self: flex-start;
        }
      `}</style>
    </div>
  );
}
