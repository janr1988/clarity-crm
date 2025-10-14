import { describe, it, expect } from 'vitest';
import { createTaskSchema } from '@/lib/validation';

describe('Task validation', () => {
  it('accepts valid payload with ISO dueDate', () => {
    const parsed = createTaskSchema.parse({
      title: 'Call',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: new Date().toISOString(),
    });
    expect(parsed.title).toBe('Call');
  });

  it('rejects non-ISO dueDate', () => {
    expect(() =>
      createTaskSchema.parse({ title: 'X', dueDate: '28.10.2025, 15:47' as any })
    ).toThrow();
  });
});


