/**
 * Generate initials from a user's name
 * Handles edge cases: single names, special characters, multi-part names
 * Examples:
 * - "John Doe" -> "JD"
 * - "Abd El-Rahman" -> "AR"
 * - "Muhammad" -> "MU"
 * - "Jean-Pierre Dupont" -> "JD"
 */
export function getInitials(name: string, maxChars: number = 2): string {
  if (!name || typeof name !== 'string') return '?';

  // Remove extra spaces and trim
  const cleanName = name.trim().replace(/\s+/g, ' ');

  // Split by space, dash, or other word boundaries
  const parts = cleanName.split(/[\s\-\.]+/).filter(part => part.length > 0);

  if (parts.length === 0) return '?';

  // For single name, take first N characters
  if (parts.length === 1) {
    return parts[0].substring(0, maxChars).toUpperCase();
  }

  // For multiple parts, take first letter of first part + first letter of last part
  // Then add more if maxChars allows
  const initials: string[] = [parts[0].charAt(0)];

  if (maxChars > 1) {
    initials.push(parts[parts.length - 1].charAt(0));
  }

  if (maxChars > 2 && parts.length > 2) {
    initials.push(parts[1].charAt(0));
  }

  return initials.join('').toUpperCase();
}

/**
 * Alternative function that generates initials by taking first char of first N words
 */
export function getInitialsByWords(name: string, numWords: number = 2): string {
  if (!name || typeof name !== 'string') return '?';

  const words = name.trim().split(/\s+/).filter(word => word.length > 0);
  const initials = words.slice(0, numWords).map(word => word.charAt(0)).join('');

  return initials.toUpperCase();
}
