/** Joins class names, dropping falsy parts. No merging: components avoid conflicting utilities. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
