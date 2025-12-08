/**
 * Avatar color palette - 12 distinct colors for consistent avatar backgrounds
 * Colors are chosen for good contrast with white text and visual distinction
 */
const AVATAR_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6B7280', // Gray
  '#D946EF', // Fuchsia
];

/**
 * Generate a consistent color for a user based on their ID or name
 * Uses a simple hash function to ensure the same user always gets the same color
 */
export function getAvatarColor(userId: string | undefined, userName?: string): string {
  // Use userId if available, fallback to userName
  const hashInput = userId || userName || '';

  if (!hashInput) {
    return AVATAR_COLORS[0]; // Default to blue
  }

  // Simple hash function: sum of character codes modulo color count
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    hash = ((hash << 5) - hash) + hashInput.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  const colorIndex = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[colorIndex];
}

/**
 * Get a lighter shade of an avatar color for hover states
 */
export function getLighterAvatarColor(baseColor: string): string {
  // Convert hex to RGB, lighten, convert back
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Lighten by 30%
  const lightR = Math.min(255, Math.round(r * 1.3));
  const lightG = Math.min(255, Math.round(g * 1.3));
  const lightB = Math.min(255, Math.round(b * 1.3));

  return `#${lightR.toString(16).padStart(2, '0')}${lightG.toString(16).padStart(2, '0')}${lightB.toString(16).padStart(2, '0')}`;
}

/**
 * Get all available avatar colors (useful for color picker)
 */
export function getAvatarColorPalette(): string[] {
  return [...AVATAR_COLORS];
}
