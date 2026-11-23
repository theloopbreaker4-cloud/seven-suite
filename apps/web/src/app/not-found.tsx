/** Seven Suite — github.com/theloopbreaker4-cloud/seven-suite */

/** Paths outside any language (the proxy normally adds one), e.g. /ka/x/y with an unknown locale. */
export default function RootNotFound() {
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
          <p style={{ fontSize: 48, margin: 0, opacity: 0.4 }}>404</p>
          <h1>Page not found</h1>
          <a href="/">Home</a>
        </main>
      </body>
    </html>
  );
}
