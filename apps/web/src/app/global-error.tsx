'use client';
/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */

/** Last resort when even the layout failed (no translations available here). */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main
          style={{
            fontFamily: 'system-ui, sans-serif',
            maxWidth: 560,
            margin: '15vh auto',
            padding: 16,
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 48, margin: 0, opacity: 0.4 }}>500</p>
          <h1>Something went wrong</h1>
          <p>Please try again in a moment.</p>
          <button type="button" onClick={() => reset()}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
