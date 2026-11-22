const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** `22 Nov 2026`, always UTC so every visitor (and the server render) sees the same text. */
export const formatDateUtc = (date: Date): string => DATE_FORMAT.format(date);
