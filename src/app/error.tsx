"use client";

// Rendered for uncaught errors below the root layout. The error itself is
// logged on the server by instrumentation.ts (onRequestError).
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main>
      <h1>500 - Something went wrong</h1>
      {error.digest ? <p>Reference: {error.digest}</p> : null}
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
