"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#f7f8fa",
          color: "#101820",
          fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: "40rem", margin: "0 auto", padding: "6rem 1.5rem" }}>
          <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", color: "#b86b2f" }}>
            AstraBazaar
          </p>
          <h1 style={{ fontSize: "2.5rem", margin: "0.75rem 0 0" }}>Something went wrong</h1>
          <p style={{ color: "#4a5562", lineHeight: 1.6 }}>
            The store hit a problem and couldn’t finish loading. Try again, or return home.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              background: "#101820",
              color: "#fff",
              border: 0,
              padding: "0.75rem 1.25rem",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
