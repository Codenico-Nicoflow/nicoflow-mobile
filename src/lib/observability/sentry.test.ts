const mockInit = jest.fn();

jest.mock('@sentry/react-native', () => ({ init: mockInit }));
jest.mock('@/constants/env', () => ({ env: { sentryDsn: undefined } }));

describe('initSentry', () => {
  afterEach(() => {
    mockInit.mockClear();
    jest.resetModules();
  });

  it('no-ops without a DSN — calls Sentry.init but never throws', () => {
    const { initSentry } = require('./sentry');
    expect(() => initSentry()).not.toThrow();
    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ dsn: undefined }));
  });

  it('passes a configured DSN through to Sentry.init', () => {
    jest.doMock('@/constants/env', () => ({ env: { sentryDsn: 'https://key@sentry.io/123' } }));

    const { initSentry } = require('./sentry');
    initSentry();
    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ dsn: 'https://key@sentry.io/123' }));
  });
});
