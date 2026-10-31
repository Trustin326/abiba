import { describe, expect, it } from 'vitest';
import type { Offer } from '../types';
import { buildOfferShareText } from './sharing';

describe('buildOfferShareText', () => {
  it('creates a concise share message with the offer price', () => {
    const offer: Offer = { id: 'o1', title: 'Brand Sprint', category: 'Creative services', price: 2400, status: 'Ready' };
    expect(buildOfferShareText(offer)).toBe('Brand Sprint\nCreative services\nInvestment: $2,400\nInterested? Reply and I’ll share the next steps.');
  });

  it('formats zero-price offers without invalid currency output', () => {
    const offer: Offer = { id: 'o2', title: 'Discovery Call', category: 'Consulting', price: 0, status: 'Draft' };
    expect(buildOfferShareText(offer)).toContain('Investment: $0');
  });
});
