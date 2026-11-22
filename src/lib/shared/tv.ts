import { createTV } from "tailwind-variants";
import { twMerge } from "./tw-merge";

/** tv() with the project-aware merger (see tw-merge.ts). Import recipes' tv from here. */
export const tv = createTV({ twMerge });
