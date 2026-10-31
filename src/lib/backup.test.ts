import { describe, expect, it } from 'vitest';
import { parseWorkspaceBackup } from './backup';

const valid = {
  contacts: [{ id: 'c1', name: 'Alex Morgan', email: 'alex@example.com', company: 'Studio', stage: 'Lead', value: 120, createdAt: '2026-10-31' }],
  tasks: [{ id: 't1', title: 'Send proposal', due: 'Today', priority: 'High', done: false }],
  offers: [{ id: 'o1', title: 'Brand sprint', category: 'Service', price: 500, status: 'Ready' }],
};

describe('parseWorkspaceBackup', () => {
  it('accepts a valid Business OS backup', () => {
    expect(parseWorkspaceBackup(valid)).toEqual(valid);
  });

  it('accepts empty collections', () => {
    expect(parseWorkspaceBackup({ contacts: [], tasks: [], offers: [] })).toEqual({ contacts: [], tasks: [], offers: [] });
  });

  it('rejects files that are not Business OS backups', () => {
    expect(() => parseWorkspaceBackup({ contacts: [] })).toThrow(/containing contacts, tasks, and offers/);
    expect(() => parseWorkspaceBackup(null)).toThrow();
  });

  it('rejects invalid values before any records can be imported', () => {
    const invalid = { ...valid, contacts: [{ ...valid.contacts[0], value: -1 }] };
    expect(() => parseWorkspaceBackup(invalid)).toThrow(/invalid or unsupported/);
  });

  it('rejects duplicate IDs within a collection', () => {
    const duplicate = { ...valid, tasks: [valid.tasks[0], { ...valid.tasks[0], title: 'Another task' }] };
    expect(() => parseWorkspaceBackup(duplicate)).toThrow(/duplicate record IDs/);
  });
});
