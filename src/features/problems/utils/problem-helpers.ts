import { BadgeVariant } from '@/shared/ui/badge';

/**
 * Maps a problem difficulty level to an accessible UI Badge variant
 */
export function getDifficultyBadgeVariant(difficulty?: string | null): BadgeVariant {
  if (!difficulty) return 'default';

  const normalized = difficulty.trim().toLowerCase();

  switch (normalized) {
    case 'easy':
    case 'beginner':
      return 'success';
    case 'medium':
    case 'intermediate':
      return 'warning';
    case 'hard':
    case 'advanced':
    case 'expert':
      return 'error';
    default:
      return 'default';
  }
}

/**
 * Formats a difficulty string into standardized title case
 */
export function formatDifficulty(difficulty?: string | null): string {
  if (!difficulty || difficulty.trim() === '') {
    return 'Standard';
  }

  const trimmed = difficulty.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Safely truncates long description text at a whitespace boundary
 */
export function truncateText(text?: string | null, maxLength = 140): string {
  if (!text) return '';
  const clean = text.replace(/[\r\n]+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;

  const sub = clean.slice(0, maxLength);
  const lastSpace = sub.lastIndexOf(' ');
  const cutoff = lastSpace > maxLength * 0.7 ? lastSpace : maxLength;

  return `${clean.slice(0, cutoff).trim()}…`;
}
