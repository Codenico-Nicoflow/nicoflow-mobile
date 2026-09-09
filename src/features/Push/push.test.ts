import { shouldShowAlert } from './foregroundPolicy';
import { resolveTapTarget } from './tapRouting';

describe('shouldShowAlert', () => {
  it.each`
    isForeground | isWSConnected | want     | why
    ${true}      | ${true}       | ${false} | ${'the socket already delivered it in-app'}
    ${true}      | ${false}      | ${true}  | ${'no socket means the banner is the only signal'}
    ${false}     | ${true}       | ${true}  | ${'backgrounded users never see the in-app update'}
    ${false}     | ${false}      | ${true}  | ${'backgrounded and offline'}
  `('returns $want when foreground=$isForeground ws=$isWSConnected — $why', ({ isForeground, isWSConnected, want }) => {
    expect(shouldShowAlert({ isForeground, isWSConnected })).toBe(want);
  });
});

describe('resolveTapTarget', () => {
  it('deep-links a celebration to its task', () => {
    expect(resolveTapTarget({ type: 'task_completed', metadata: { taskId: 't1' } })).toEqual({
      kind: 'deepLink',
      href: '/task/t1',
    });
  });

  it('deep-links a project celebration to its project', () => {
    expect(resolveTapTarget({ type: 'project_completed', metadata: { projectId: 'p1' } })).toEqual({
      kind: 'deepLink',
      href: '/project/p1',
    });
  });

  it('prefers the task over the project when a celebration carries both', () => {
    // A task-level celebration also carries its projectId; the task is the more
    // specific destination.
    expect(resolveTapTarget({ type: 'task_completed', metadata: { taskId: 't1', projectId: 'p1' } })).toEqual({
      kind: 'deepLink',
      href: '/task/t1',
    });
  });

  it.each(['morning_digest', 'evening_digest'])('expands a %s rather than guessing an entity', type => {
    // A digest covers many entities, so there is no single deep-link target.
    expect(resolveTapTarget({ type, metadata: { completed: 3 } })).toEqual({ kind: 'expand' });
  });

  it('expands a system announcement', () => {
    expect(resolveTapTarget({ type: 'system_announcement', metadata: {} })).toEqual({ kind: 'expand' });
  });

  it('expands a celebration whose metadata names no entity', () => {
    // Better the list than navigating nowhere.
    expect(resolveTapTarget({ type: 'streak_milestone', metadata: { streak: 7 } })).toEqual({ kind: 'expand' });
  });

  it.each([
    ['missing type', {}],
    ['non-string type', { type: 42 }],
    ['missing metadata', { type: 'task_completed' }],
    ['non-object metadata', { type: 'task_completed', metadata: 'nope' }],
    ['non-string id', { type: 'task_completed', metadata: { taskId: 42 } }],
  ])('falls back to expand for a malformed payload (%s)', (_label, payload) => {
    // Push data crosses a process boundary and is not schema-checked, so a
    // malformed payload must degrade rather than throw inside the tap handler.
    expect(resolveTapTarget(payload)).toEqual({ kind: 'expand' });
  });
});
