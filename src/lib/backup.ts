import type { Contact, Offer, Task } from '../types';

export type WorkspaceBackup = {
  contacts: Contact[];
  tasks: Task[];
  offers: Offer[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const uniqueIds = (items: Array<{ id: string }>) =>
  new Set(items.map(item => item.id)).size === items.length;

export function parseWorkspaceBackup(value: unknown): WorkspaceBackup {
  if (!isRecord(value) || !Array.isArray(value.contacts) ||
      !Array.isArray(value.tasks) || !Array.isArray(value.offers)) {
    throw new Error('Choose a Business OS JSON backup containing contacts, tasks, and offers.');
  }

  const contacts = value.contacts;
  const tasks = value.tasks;
  const offers = value.offers;

  const validContacts = contacts.every((item): item is Contact =>
    isRecord(item) &&
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.name === 'string' && item.name.length > 0 && item.name.length <= 160 &&
    typeof item.email === 'string' && item.email.length <= 320 &&
    typeof item.company === 'string' &&
    ['Lead', 'Qualified', 'Client'].includes(String(item.stage)) &&
    typeof item.value === 'number' && Number.isFinite(item.value) && item.value >= 0 &&
    typeof item.createdAt === 'string' &&
    (item.notes === undefined || (typeof item.notes === 'string' && item.notes.length <= 2000)) &&
    (item.followUpDate === undefined || (typeof item.followUpDate === 'string' && (item.followUpDate === '' || /^\\d{4}-\\d{2}-\\d{2}$/.test(item.followUpDate)))) &&\n    (item.activityLog === undefined || (Array.isArray(item.activityLog) && item.activityLog.length <= 100 && item.activityLog.every(entry => isRecord(entry) && typeof entry.id === 'string' && entry.id.length > 0 && typeof entry.at === 'string' && !Number.isNaN(Date.parse(entry.at)) && typeof entry.note === 'string' && entry.note.length <= 1000)))
  );

  const validTasks = tasks.every((item): item is Task =>
    isRecord(item) &&
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.title === 'string' && item.title.length > 0 && item.title.length <= 500 &&
    typeof item.due === 'string' &&
    ['Low', 'Medium', 'High'].includes(String(item.priority)) &&
    typeof item.done === 'boolean'
  );

  const validOffers = offers.every((item): item is Offer =>
    isRecord(item) &&
    typeof item.id === 'string' && item.id.length > 0 &&
    typeof item.title === 'string' && item.title.length > 0 && item.title.length <= 200 &&
    typeof item.category === 'string' &&
    typeof item.price === 'number' && Number.isFinite(item.price) && item.price >= 0 &&
    ['Draft', 'Ready'].includes(String(item.status))
  );

  if (!validContacts || !validTasks || !validOffers) {
    throw new Error('The backup contains invalid or unsupported records. No data was imported.');
  }
  if (!uniqueIds(contacts) || !uniqueIds(tasks) || !uniqueIds(offers)) {
    throw new Error('The backup contains duplicate record IDs. No data was imported.');
  }

  return { contacts, tasks, offers };
}
