import { cn } from "@/lib/shared/cn";

const CORNERS = [
  "top-0 left-0 border-t border-l",
  "top-0 right-0 border-t border-r",
  "bottom-0 left-0 border-b border-l",
  "bottom-0 right-0 border-b border-r",
] as const;

/** L-shaped crop marks 8px outside a framed element (docs/STYLE.md §5.2). Parent must be `relative`. */
export const CropMarks = ({ className }: { className?: string }) => (
  <span aria-hidden className={cn("pointer-events-none absolute -inset-2 print:hidden", className)}>
    {CORNERS.map((corner) => (
      <span key={corner} className={cn("absolute size-3 border-rule", corner)} />
    ))}
  </span>
);
