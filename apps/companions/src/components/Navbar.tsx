'use client';

import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-brand">
          Anplexa
        </Link>
        <div className="navbar-links">
          <Link href="/" className="navbar-link">
            Home
          </Link>
          <Link href="/companion" className="navbar-link">
            Companion
          </Link>
          <Link href="/business" className="navbar-link">
            Business
          </Link>
        </div>
      </div>
      <style jsx>{`
        .navbar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 1rem 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .navbar-brand {
          font-size: 1.5rem;
          font-weight: bold;
          color: white;
          text-decoration: none;
          transition: opacity 0.2s;
        }
        .navbar-brand:hover {
          opacity: 0.8;
        }
        .navbar-links {
          display: flex;
          gap: 2rem;
        }
        .navbar-link {
          color: white;
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s;
        }
        .navbar-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }
      `}</style>
    </nav>
  );
}
