import {
  formatDifficulty,
  getDifficultyBadgeVariant,
  truncateText,
} from '../utils/problem-helpers';

describe('problem-helpers', () => {
  describe('getDifficultyBadgeVariant', () => {
    it('maps easy and beginner to success variant', () => {
      expect(getDifficultyBadgeVariant('easy')).toBe('success');
      expect(getDifficultyBadgeVariant('Easy')).toBe('success');
      expect(getDifficultyBadgeVariant('beginner')).toBe('success');
    });

    it('maps medium and intermediate to warning variant', () => {
      expect(getDifficultyBadgeVariant('medium')).toBe('warning');
      expect(getDifficultyBadgeVariant('Medium')).toBe('warning');
      expect(getDifficultyBadgeVariant('intermediate')).toBe('warning');
      expect(getDifficultyBadgeVariant('Intermediate')).toBe('warning');
    });

    it('maps hard and advanced to error variant', () => {
      expect(getDifficultyBadgeVariant('hard')).toBe('error');
      expect(getDifficultyBadgeVariant('Hard')).toBe('error');
      expect(getDifficultyBadgeVariant('advanced')).toBe('error');
      expect(getDifficultyBadgeVariant('expert')).toBe('error');
    });

    it('defaults to default variant for unclassified or null difficulty', () => {
      expect(getDifficultyBadgeVariant(null)).toBe('default');
      expect(getDifficultyBadgeVariant(undefined)).toBe('default');
      expect(getDifficultyBadgeVariant('Custom Level')).toBe('default');
    });
  });

  describe('formatDifficulty', () => {
    it('formats difficulty string into title case', () => {
      expect(formatDifficulty('hard')).toBe('Hard');
      expect(formatDifficulty('MEDIUM')).toBe('Medium');
      expect(formatDifficulty('intermediate')).toBe('Intermediate');
    });

    it('returns Standard for null or empty values', () => {
      expect(formatDifficulty(null)).toBe('Standard');
      expect(formatDifficulty(undefined)).toBe('Standard');
      expect(formatDifficulty('')).toBe('Standard');
      expect(formatDifficulty('   ')).toBe('Standard');
    });
  });

  describe('truncateText', () => {
    it('returns empty string for null or undefined input', () => {
      expect(truncateText(null)).toBe('');
      expect(truncateText(undefined)).toBe('');
    });

    it('returns original text if under maxLength', () => {
      const shortText = 'Build an offline sync system';
      expect(truncateText(shortText, 50)).toBe(shortText);
    });

    it('safely truncates long text at word boundaries with ellipsis', () => {
      const longText =
        'Build an ultra-low-latency on-device computer vision model to detect organ anomalies from portable point-of-care ultrasound devices in remote village clinics.';
      const truncated = truncateText(longText, 60);
      expect(truncated.endsWith('…')).toBe(true);
      expect(truncated.length).toBeLessThanOrEqual(61);
      expect(longText.startsWith(truncated.replace('…', ''))).toBe(true);
    });
  });
});
