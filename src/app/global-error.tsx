'use client';

import { useEffect } from 'react';

/**
 * Replaces the root layout when rendering itself fails, so it cannot rely on
 * providers, fonts or translations. Both languages are inlined deliberately —
 * there is no locale context available at this point.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[renvura] global error', error);
  }, [error]);

  return (
    <html lang="bn">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f7f1e5',
          color: '#11253c',
          fontFamily: 'system-ui, sans-serif',
          padding: '2rem',
        }}
      >
        <main style={{ maxWidth: '32rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '0.25rem',
              borderRadius: '999px',
              backgroundColor: '#cdaf80',
            }}
          />
          <h1 style={{ fontSize: '1.75rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
            কিছু একটা সমস্যা হয়েছে
          </h1>
          <p style={{ margin: '0 0 1.5rem', color: '#4a5a6e' }}>
            Something went wrong. Please try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              minHeight: '3rem',
              padding: '0 1.5rem',
              borderRadius: '0.75rem',
              border: 'none',
              backgroundColor: '#cdaf80',
              color: '#11253c',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            আবার চেষ্টা করুন · Try again
          </button>
          <p style={{ marginTop: '2rem', fontSize: '0.875rem', color: '#4a5a6e' }}>
            <a href="mailto:hello@renvura.com" style={{ color: '#11253c' }}>
              hello@renvura.com
            </a>
          </p>
        </main>
      </body>
    </html>
  );
}
