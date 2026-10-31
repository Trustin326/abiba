import type { Offer } from '../types';
import { formatCurrency } from './metrics';

export function buildOfferShareText(offer: Offer): string {
  return [
    offer.title,
    offer.category,
    'Investment: ' + formatCurrency(offer.price),
    'Interested? Reply and I’ll share the next steps.',
  ].join('\n');
}
