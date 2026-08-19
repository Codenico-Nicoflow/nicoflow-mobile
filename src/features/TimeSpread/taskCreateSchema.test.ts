import { taskCreateSchema } from './taskCreateSchema';

const base = { title: 'Write report', projectId: 'p1' };

describe('taskCreateSchema', () => {
  it('accepts the minimum valid input (title + project only)', () => {
    const result = taskCreateSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it('defaults priority, energy, and recurrence when omitted', () => {
    const result = taskCreateSchema.parse(base);
    expect(result.priority).toBe('medium');
    expect(result.energy).toBe('medium');
    expect(result.recurrence).toBe('none');
  });

  it('rejects a missing title', () => {
    const result = taskCreateSchema.safeParse({ projectId: 'p1' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing project', () => {
    const result = taskCreateSchema.safeParse({ title: 'Write report' });
    expect(result.success).toBe(false);
  });

  it.each(['none', 'daily', 'weekly', 'monthly'])('accepts recurrence preset %s', preset => {
    const result = taskCreateSchema.safeParse({ ...base, recurrence: preset });
    expect(result.success).toBe(true);
  });

  it('rejects a recurrence value outside the four presets', () => {
    const result = taskCreateSchema.safeParse({ ...base, recurrence: 'yearly' });
    expect(result.success).toBe(false);
  });
});
