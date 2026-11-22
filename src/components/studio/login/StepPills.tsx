import { Check } from "lucide-react";
import { cn } from "@/lib/shared/cn";

type StepPillsProps = { labels: readonly string[]; current: number };

/** "● Email — ○ Access code": done steps get a check, the current one the accent. */
export const StepPills = ({ labels, current }: StepPillsProps) => (
  <ol className="flex items-center gap-2" aria-label="Progress">
    {labels.map((label, index) => {
      const done = index < current;
      const active = index === current;
      return (
        <li key={label} className="flex items-center gap-2" aria-current={active ? "step" : undefined}>
          {index > 0 ? (
            <span aria-hidden className={cn("h-px w-6", done || active ? "bg-primary/50" : "bg-border")} />
          ) : null}
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-200",
              active && "border-primary/30 bg-primary/10 text-primary",
              done && "border-border text-foreground",
              !active && !done && "border-border text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "grid size-4 place-items-center rounded-full text-[0.625rem] font-semibold tabular-nums",
                active && "bg-primary text-primary-foreground",
                done && "bg-primary/15 text-primary",
                !active && !done && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check aria-hidden className="size-3" /> : index + 1}
            </span>
            {label}
          </span>
        </li>
      );
    })}
  </ol>
);
