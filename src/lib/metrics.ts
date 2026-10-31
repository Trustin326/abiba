import type { Contact, Offer, Task } from '../types';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
}

export function calculateBusinessMetrics(contacts: Contact[], tasks: Task[], offers: Offer[]) {
  const clientValue = contacts.filter(contact => contact.stage === 'Client').reduce((total, contact) => total + contact.value, 0);
  const pipeline = contacts.filter(contact => contact.stage !== 'Client').reduce((total, contact) => total + contact.value, 0);
  const done = tasks.filter(task => task.done).length;
  const readyOffers = offers.filter(offer => offer.status === 'Ready').length;
  return {
    clientValue,
    pipeline,
    done,
    openTasks: tasks.length - done,
    readyOffers,
    taskCompletionPercent: tasks.length ? Math.round(done / tasks.length * 100) : 0,
  };
}
