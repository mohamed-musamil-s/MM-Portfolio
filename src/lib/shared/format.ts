const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** `22 Nov 2026`, always UTC so every visitor (and the server render) sees the same text. */
export const formatDateUtc = (date: Date): string => DATE_FORMAT.format(date);

/** "+12%" / "−8%" / "0%", or null without an earlier figure to compare with. */
export const percentChange = (now: number, before: number): string | null => {
  if (before <= 0) return null;
  const percent = Math.round(((now - before) / before) * 100);
  return `${percent > 0 ? "+" : percent < 0 ? "−" : ""}${Math.abs(percent)}%`;
};
