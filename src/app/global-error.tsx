"use client";

// Last-resort boundary when the root layout itself fails.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main>
          <h1>500 - Something went wrong</h1>
          {error.digest ? <p>Reference: {error.digest}</p> : null}
          <button type="button" onClick={reset}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
