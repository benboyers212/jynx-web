// Common timezones for user selection
// IANA timezone database format

export const COMMON_TIMEZONES = [
  // US Timezones
  { value: "America/New_York", label: "Eastern Time (ET)", offset: "UTC-5/-4" },
  { value: "America/Chicago", label: "Central Time (CT)", offset: "UTC-6/-5" },
  { value: "America/Denver", label: "Mountain Time (MT)", offset: "UTC-7/-6" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)", offset: "UTC-8/-7" },
  { value: "America/Phoenix", label: "Arizona (MST)", offset: "UTC-7" },
  { value: "America/Anchorage", label: "Alaska Time", offset: "UTC-9/-8" },
  { value: "Pacific/Honolulu", label: "Hawaii Time", offset: "UTC-10" },

  // Americas
  { value: "America/Toronto", label: "Toronto (ET)", offset: "UTC-5/-4" },
  { value: "America/Vancouver", label: "Vancouver (PT)", offset: "UTC-8/-7" },
  { value: "America/Mexico_City", label: "Mexico City", offset: "UTC-6/-5" },
  { value: "America/Sao_Paulo", label: "São Paulo", offset: "UTC-3" },
  { value: "America/Buenos_Aires", label: "Buenos Aires", offset: "UTC-3" },

  // Europe
  { value: "Europe/London", label: "London (GMT/BST)", offset: "UTC+0/+1" },
  { value: "Europe/Paris", label: "Paris (CET)", offset: "UTC+1/+2" },
  { value: "Europe/Berlin", label: "Berlin (CET)", offset: "UTC+1/+2" },
  { value: "Europe/Madrid", label: "Madrid (CET)", offset: "UTC+1/+2" },
  { value: "Europe/Rome", label: "Rome (CET)", offset: "UTC+1/+2" },
  { value: "Europe/Amsterdam", label: "Amsterdam (CET)", offset: "UTC+1/+2" },
  { value: "Europe/Moscow", label: "Moscow", offset: "UTC+3" },

  // Asia & Pacific
  { value: "Asia/Dubai", label: "Dubai (GST)", offset: "UTC+4" },
  { value: "Asia/Kolkata", label: "India (IST)", offset: "UTC+5:30" },
  { value: "Asia/Singapore", label: "Singapore", offset: "UTC+8" },
  { value: "Asia/Hong_Kong", label: "Hong Kong", offset: "UTC+8" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)", offset: "UTC+8" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)", offset: "UTC+9" },
  { value: "Asia/Seoul", label: "Seoul (KST)", offset: "UTC+9" },
  { value: "Australia/Sydney", label: "Sydney (AEST)", offset: "UTC+10/+11" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST)", offset: "UTC+10/+11" },
  { value: "Pacific/Auckland", label: "Auckland (NZST)", offset: "UTC+12/+13" },
] as const;

export type TimezoneValue = (typeof COMMON_TIMEZONES)[number]["value"];

/**
 * Get the browser's detected timezone
 */
export function detectBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "America/New_York"; // fallback
  }
}

/**
 * Format a timezone for display
 */
export function formatTimezoneLabel(tz: string): string {
  const found = COMMON_TIMEZONES.find((t) => t.value === tz);
  if (found) {
    return `${found.label} (${found.offset})`;
  }
  // For timezones not in our list, just return the IANA name
  return tz.replace(/_/g, " ");
}

/**
 * Get the current time in a specific timezone
 */
export function getCurrentTimeInTimezone(timezone: string): string {
  try {
    return new Date().toLocaleTimeString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

/**
 * Check if a timezone string is valid
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get ISO datetime string in a specific timezone (without Z suffix)
 * This is useful for AI tool inputs that need local times
 */
export function getLocalISOString(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return formatter.format(date).replace(" ", "T");
}
