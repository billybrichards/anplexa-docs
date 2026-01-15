// Business Solutions Landing Page
export default function BusinessPage() {
  return (
    <div className="business-page">
      <div className="hero">
        <h1>💼 Anplexa Business Solutions</h1>
        <p className="tagline">
          Enterprise AI Tools and Consulting for Modern Businesses
        </p>
      </div>

      <div className="content">
        <section className="intro-section">
          <h2>Transform Your Business with AI</h2>
          <p>
            Anplexa provides cutting-edge AI solutions tailored to your
            business needs. From custom chatbots to advanced analytics, we help
            you harness the power of artificial intelligence.
          </p>
        </section>

        <section className="services-section">
          <h2>Our Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <h3>🤖 Custom AI Chatbots</h3>
              <p>
                Build intelligent conversational agents that understand your
                customers and provide 24/7 support
              </p>
            </div>
            <div className="service-card">
              <h3>📊 AI Analytics</h3>
              <p>
                Unlock insights from your data with advanced machine learning
                and predictive analytics
              </p>
            </div>
            <div className="service-card">
              <h3>🎯 Personalization Engine</h3>
              <p>
                Deliver personalized experiences at scale with AI-driven
                recommendation systems
              </p>
            </div>
            <div className="service-card">
              <h3>🔧 AI Consulting</h3>
              <p>
                Expert guidance on AI strategy, implementation, and best
                practices for your organization
              </p>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <h2>Ready to Get Started?</h2>
          <p>Contact us to discuss your AI needs</p>
          <button className="cta-button">Schedule a Consultation</button>
        </section>
      </div>

      <style jsx>{`
        .business-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 2rem;
        }
        .hero {
          text-align: center;
          margin-bottom: 4rem;
          padding: 3rem 2rem;
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
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
          gap: 4rem;
        }
        .intro-section {
          text-align: center;
        }
        .intro-section h2 {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
        }
        .intro-section p {
          font-size: 1.2rem;
          color: #666;
          max-width: 800px;
          margin: 0 auto;
        }
        .services-section h2 {
          font-size: 2.5rem;
          margin-bottom: 2rem;
          text-align: center;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }
        .service-card {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s ease;
        }
        .service-card:hover {
          transform: translateY(-4px);
        }
        .service-card h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #2563eb;
        }
        .service-card p {
          color: #666;
          line-height: 1.6;
        }
        .cta-section {
          text-align: center;
          padding: 3rem 2rem;
          background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
          border-radius: 16px;
        }
        .cta-section h2 {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .cta-section p {
          font-size: 1.1rem;
          color: #666;
          margin-bottom: 2rem;
        }
        .cta-button {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          color: white;
          border: none;
          padding: 1rem 2.5rem;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        }
        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5);
        }
      `}</style>
    </div>
  );
}
