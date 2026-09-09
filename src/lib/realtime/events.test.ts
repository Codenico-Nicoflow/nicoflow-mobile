import { isWSConnected, setWSConnected } from './connectionState';
import { safeParse, WS_EVENT_TAGS } from './events';

afterEach(() => setWSConnected(false));

describe('safeParse', () => {
  it('parses a well-formed envelope', () => {
    expect(safeParse(JSON.stringify({ event: 'task.created', payload: { id: 't1' } }))).toEqual({
      event: 'task.created',
      payload: { id: 't1' },
    });
  });

  it('keeps an event with no payload', () => {
    expect(safeParse(JSON.stringify({ event: 'ai.session.updated' }))).toEqual({
      event: 'ai.session.updated',
      payload: undefined,
    });
  });

  it.each([
    ['malformed json', 'not json'],
    ['a non-object frame', '42'],
    ['null', 'null'],
    ['a missing event name', JSON.stringify({ payload: {} })],
    ['a non-string event name', JSON.stringify({ event: 7 })],
    ['an empty event name', JSON.stringify({ event: '' })],
    ['a non-string frame', 123],
  ])('returns null for %s rather than throwing', (_label, raw) => {
    // One bad frame must never kill the socket.
    expect(safeParse(raw)).toBeNull();
  });
});

describe('WS_EVENT_TAGS', () => {
  it('maps notification.created to both notification tags', () => {
    expect(WS_EVENT_TAGS['notification.created']).toEqual(['Notification', 'NotificationCount']);
  });

  it('invalidates Area and Search alongside Project, since both embed projects', () => {
    expect(WS_EVENT_TAGS['project.created']).toEqual(['Project', 'Area', 'Search']);
  });

  it('has no entry for an unknown event, so the client stays forward-compatible', () => {
    expect(WS_EVENT_TAGS['something.new']).toBeUndefined();
  });
});

describe('connectionState', () => {
  it('starts disconnected', () => {
    expect(isWSConnected()).toBe(false);
  });

  it('publishes the live state for the push handler to read', () => {
    // The push handler runs outside React and cannot read the store, which is
    // why this is a module-level flag rather than component state.
    setWSConnected(true);
    expect(isWSConnected()).toBe(true);

    setWSConnected(false);
    expect(isWSConnected()).toBe(false);
  });
});
