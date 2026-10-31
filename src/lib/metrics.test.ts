import { describe, expect, it } from 'vitest';
import { calculateBusinessMetrics, formatCurrency } from './metrics';
import type { Contact, Offer, Task } from '../types';

const contacts: Contact[] = [
  { id: '1', name: 'Client', email: 'client@example.com', company: 'Studio A', stage: 'Client', value: 2400, createdAt: '2026-10-01' },
  { id: '2', name: 'Lead', email: 'lead@example.com', company: 'Studio B', stage: 'Lead', value: 950, createdAt: '2026-10-02' },
  { id: '3', name: 'Qualified', email: 'qualified@example.com', company: 'Studio C', stage: 'Qualified', value: 1250, createdAt: '2026-10-03' },
];
const tasks: Task[] = [
  { id: '1', title: 'Done', due: 'Today', priority: 'High', done: true },
  { id: '2', title: 'Open', due: 'Tomorrow', priority: 'Low', done: false },
];
const offers: Offer[] = [
  { id: '1', title: 'Ready offer', category: 'Service', price: 500, status: 'Ready' },
  { id: '2', title: 'Draft offer', category: 'Consulting', price: 200, status: 'Draft' },
];

describe('calculateBusinessMetrics', () => {
  it('separates existing client value from the open pipeline', () => {
    expect(calculateBusinessMetrics(contacts, tasks, offers)).toMatchObject({
      clientValue: 2400, pipeline: 2200, done: 1, openTasks: 1, readyOffers: 1, taskCompletionPercent: 50,
    });
  });
  it('handles an empty workspace without division by zero', () => {
    expect(calculateBusinessMetrics([], [], [])).toMatchObject({
      clientValue: 0, pipeline: 0, done: 0, openTasks: 0, readyOffers: 0, taskCompletionPercent: 0,
    });
  });
  it('formats currency and safely handles non-finite values', () => {
    expect(formatCurrency(1234)).toBe('$1,234');
    expect(formatCurrency(Number.NaN)).toBe('$0');
  });
});
