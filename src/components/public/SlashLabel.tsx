import { Fragment } from "react";
import { cn } from "@/lib/shared/cn";

/** Poster-style label: `MINDSET / AMBITION / FREEDOM` (docs/STYLE.md §3.3 rule 5). */
export const SlashLabel = ({ words, className }: { words: readonly string[]; className?: string }) => (
  <p className={cn("font-grotesk text-label font-bold uppercase", className)}>
    {words.map((word, index) => (
      <Fragment key={word}>
        {index > 0 ? <span aria-hidden> / </span> : null}
        {index > 0 ? <span className="sr-only">, </span> : null}
        {word}
      </Fragment>
    ))}
  </p>
);
