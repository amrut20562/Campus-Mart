// CampusMart — Formatter unit tests (QR-04, QR-05)

import { describe, it, expect } from 'vitest';
import {
  formatINR,
  formatDate,
  CONDITION_LABELS,
  STATUS_LABELS,
  TRANSACTION_LABELS,
  REQUEST_STATUS_LABELS,
} from '@/lib/formatters';

describe('formatINR', () => {
  it('formats whole number in INR', () => {
    expect(formatINR(1000)).toContain('1,000');
    expect(formatINR(1000)).toContain('₹');
  });

  it('formats zero', () => {
    expect(formatINR(0)).toContain('0');
  });

  it('formats large number with lakh separators', () => {
    expect(formatINR(100000)).toContain('1,00,000');
  });
});

describe('formatDate', () => {
  it('returns a non-empty string for a valid ISO date', () => {
    const result = formatDate('2024-01-15T10:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('CONDITION_LABELS', () => {
  it('has labels for all conditions', () => {
    const conditions = ['new', 'like_new', 'good', 'fair', 'poor'] as const;
    for (const c of conditions) {
      expect(CONDITION_LABELS[c]).toBeTruthy();
    }
  });
});

describe('STATUS_LABELS', () => {
  it('has labels for all statuses', () => {
    const statuses = ['available', 'reserved', 'sold'] as const;
    for (const s of statuses) {
      expect(STATUS_LABELS[s]).toBeTruthy();
    }
  });
});

describe('REQUEST_STATUS_LABELS', () => {
  it('has labels for all request statuses', () => {
    const statuses = ['pending', 'accepted', 'rejected', 'cancelled'] as const;
    for (const s of statuses) {
      expect(REQUEST_STATUS_LABELS[s]).toBeTruthy();
    }
  });
});

describe('TRANSACTION_LABELS', () => {
  it('has labels for all transaction modes', () => {
    const modes = ['sell', 'exchange', 'either'] as const;
    for (const m of modes) {
      expect(TRANSACTION_LABELS[m]).toBeTruthy();
    }
  });
});
