import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge that knows this project's type scale (globals.css). Without
 * it, `text-h3` and `text-paper` look like the same group (both `text-*`) and
 * the size is silently dropped. Used by cn() and by tv() recipes.
 */
export const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["wordmark", "display", "h1", "h2", "h3", "lead", "body", "label", "micro", "micro-deco"] },
      ],
    },
  },
});
