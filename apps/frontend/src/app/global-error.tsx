'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ 
          fontFamily: 'system-ui, -apple-system, sans-serif',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <h1 style={{ fontSize: '24px', margin: '0 0 16px 0' }}>
            Something went wrong!
          </h1>
          <p style={{ color: '#666', margin: '0 0 24px 0' }}>
            An error occurred while loading this page.
          </p>
          <button 
            onClick={() => reset()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
