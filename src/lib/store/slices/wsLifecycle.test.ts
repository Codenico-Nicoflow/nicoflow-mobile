import { AppState } from 'react-native';

import { createMobileWSLifecycleAdapter } from './wsLifecycle';

function getRegisteredListener(): (state: string) => void {
  const mockAddEventListener = AppState.addEventListener as jest.Mock;
  const lastCall = mockAddEventListener.mock.calls[mockAddEventListener.mock.calls.length - 1];
  return lastCall[1];
}

describe('createMobileWSLifecycleAdapter', () => {
  beforeEach(() => {
    (AppState.addEventListener as jest.Mock).mockClear();
  });

  it('isForeground reflects the current AppState', () => {
    const adapter = createMobileWSLifecycleAdapter();

    Object.defineProperty(AppState, 'currentState', { value: 'active', configurable: true });
    expect(adapter.isForeground()).toBe(true);

    Object.defineProperty(AppState, 'currentState', { value: 'background', configurable: true });
    expect(adapter.isForeground()).toBe(false);
  });

  it('onForeground fires only on transition to active', () => {
    const adapter = createMobileWSLifecycleAdapter();
    const cb = jest.fn();
    adapter.onForeground(cb);
    const listener = getRegisteredListener();

    listener('background');
    expect(cb).not.toHaveBeenCalled();

    listener('active');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('onBackground fires only on transition away from active', () => {
    const adapter = createMobileWSLifecycleAdapter();
    const cb = jest.fn();
    adapter.onBackground(cb);
    const listener = getRegisteredListener();

    listener('active');
    expect(cb).not.toHaveBeenCalled();

    listener('background');
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe stops further callbacks', () => {
    const adapter = createMobileWSLifecycleAdapter();
    const cb = jest.fn();
    const removeMock = jest.fn();
    (AppState.addEventListener as jest.Mock).mockReturnValueOnce({ remove: removeMock });

    const unsubscribe = adapter.onForeground(cb);
    unsubscribe();

    expect(removeMock).toHaveBeenCalledTimes(1);
  });
});
