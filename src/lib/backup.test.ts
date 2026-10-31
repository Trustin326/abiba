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

  it('accepts older backups without optional contact notes and follow-up dates', () => {\n    const legacy = { ...valid, contacts: [{ id: 'c2', name: 'Sam', email: '', company: '', stage: 'Lead', value: 0, createdAt: '2026-10-01' }] };\n    expect(parseWorkspaceBackup(legacy).contacts[0].notes).toBeUndefined();\n  });\n\n  it('rejects contact notes that exceed the supported length', () => {\n    const invalid = { ...valid, contacts: [{ ...valid.contacts[0], notes: 'x'.repeat(2001) }] };\n    expect(() => parseWorkspaceBackup(invalid)).toThrow(/invalid or unsupported/);\n  });\n\n  it('accepts empty collections', () => {
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
