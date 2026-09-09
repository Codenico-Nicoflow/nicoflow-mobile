import { resolveApiUrl } from './resolveApiUrl';

describe('resolveApiUrl on Android', () => {
  it.each(['http://localhost:8080/v1', 'http://127.0.0.1:8080/v1'])(
    'rewrites the loopback host %s to the emulator alias',
    raw => {
      // This is the whole bug: on Android, localhost is the device's own
      // loopback, so every request — sign-in included — fails to connect.
      expect(resolveApiUrl(raw, 'android')).toBe('http://10.0.2.2:8080/v1');
    }
  );

  it('preserves the port and path', () => {
    expect(resolveApiUrl('http://localhost:3000/api/v2', 'android')).toBe('http://10.0.2.2:3000/api/v2');
  });

  it.each([
    ['a LAN address for a physical device', 'http://192.168.1.20:8080/v1'],
    ['staging', 'https://nicoflow-api-staging.onrender.com/v1'],
    ['production', 'https://api.nicoflow.app/v1'],
  ])('leaves %s untouched', (_label, raw) => {
    // Only loopback is ever rewritten — a real host must never be redirected.
    expect(resolveApiUrl(raw, 'android')).toBe(raw);
  });

  it('returns a malformed url unchanged rather than mangling it', () => {
    expect(resolveApiUrl('not a url', 'android')).toBe('not a url');
  });
});

describe('resolveApiUrl on other platforms', () => {
  it.each(['ios', 'web'])('leaves localhost alone on %s', platform => {
    // The iOS simulator shares the host's network stack, so localhost is correct
    // there and rewriting it would break a working setup.
    expect(resolveApiUrl('http://localhost:8080/v1', platform)).toBe('http://localhost:8080/v1');
  });
});
