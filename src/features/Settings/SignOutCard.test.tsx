import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { SignOutCard } from './SignOutCard';

const mockLogout = jest.fn();
const mockClear = jest.fn();
const mockReplace = jest.fn();

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

jest.mock('@/lib/store', () => ({
  useLogoutMutation: () => [mockLogout],
  mobileTokenStorage: { clear: (...args: unknown[]) => mockClear(...args) },
}));

jest.mock('expo-router', () => ({ router: { replace: (...args: unknown[]) => mockReplace(...args) } }));

beforeEach(() => {
  jest.clearAllMocks();
  mockLogout.mockReturnValue({ unwrap: () => Promise.resolve() });
  mockClear.mockResolvedValue(undefined);
});

const confirmSignOut = async () => {
  await render(<SignOutCard />);
  await fireEvent.press(screen.getByTestId('signout-button'));
  // 'Log out' labels the card title, the trigger and the confirm action; the
  // confirm is the last of them in the tree.
  const actions = screen.getAllByText('Log out');
  await fireEvent.press(actions[actions.length - 1]);
};

describe('SignOutCard', () => {
  it('asks for confirmation before signing out', async () => {
    await render(<SignOutCard />);

    await fireEvent.press(screen.getByTestId('signout-button'));

    // The mutation must not fire straight off the button — sign-out is
    // destructive and always goes through the confirm gate.
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('clears the SecureStore refresh token, not just Redux', async () => {
    await confirmSignOut();

    // The shared authApi slice only dispatches clearAuth. On mobile the refresh
    // token is a real persisted value, so failing to clear it here would leave
    // the next launch able to silently restore the session.
    await waitFor(() => expect(mockClear).toHaveBeenCalled());
  });

  it('navigates to sign-in after signing out', async () => {
    await confirmSignOut();

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/sign-in'));
  });

  it('still clears local credentials when the server revoke fails', async () => {
    mockLogout.mockReturnValue({ unwrap: () => Promise.reject(new Error('offline')) });

    await confirmSignOut();

    // An offline sign-out must not strand the user signed in on the device.
    await waitFor(() => expect(mockClear).toHaveBeenCalled());
    expect(mockReplace).toHaveBeenCalledWith('/sign-in');
  });
});
