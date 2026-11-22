import type { ReactNode } from "react";

/**
 * A trailing full stop becomes the signal-orange accent (presentation only;
 * the text itself is unchanged for screen readers and copy-paste).
 */
export const withSignalStop = (line: string): ReactNode =>
  line.endsWith(".") ? (
    <>
      {line.slice(0, -1)}
      <span className="text-signal">.</span>
    </>
  ) : (
    line
  );
