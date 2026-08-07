'use client';

import { useEffect } from 'react';

/**
 * Replaces the root layout when rendering itself fails, so it cannot rely on
 * providers, fonts or the design tokens. Everything is inlined.
 *
 * English carries the interface; the Bangla line is marked `lang="bn"` so it is
 * announced correctly even without the stylesheet (D-02).
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
    <html lang="en">
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
            Something went wrong
          </h1>
          <p style={{ margin: '0 0 0.5rem', color: '#4a5a6e' }}>
            The page could not be loaded. Please try again.
          </p>
          <p lang="bn" style={{ margin: '0 0 1.5rem', color: '#4a5a6e' }}>
            পৃষ্ঠাটি লোড করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।
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
            Try again
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
