import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Compose conditional classes; conflicting Tailwind utilities resolve last-wins. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
