import type { INotificationPref, IUser } from '@nicoflow/shared/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { AccountCard } from './AccountCard';
import { NotificationsCard } from './NotificationsCard';
import { ThemeCard } from './ThemeCard';

let mockUser: IUser;
let mockPrefs: INotificationPref | undefined;
let mockPrefsLoading = false;

const mockUpdateProfile = jest.fn();
const mockUpdatePreferences = jest.fn();
const mockSetOverride = jest.fn();
let mockOverride: 'light' | 'dark' | null = null;

jest.mock('@/lib/store', () => ({
  useAppUser: () => mockUser,
  useUpdateProfileMutation: () => [mockUpdateProfile, { isLoading: false }],
  useGetPreferencesQuery: () => ({ data: mockPrefs, isLoading: mockPrefsLoading }),
  useUpdatePreferencesMutation: () => [mockUpdatePreferences, { isLoading: false }],
}));

jest.mock('@/lib/theme/ThemeOverrideProvider', () => ({
  useThemeOverride: () => ({ override: mockOverride, setOverride: mockSetOverride }),
}));

const makeUser = (status: IUser['status'] = 'regular'): IUser =>
  ({
    id: 'u1',
    email: 'a@b.test',
    firstName: 'Ada',
    lastName: 'Lovelace',
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    imageUrl: '',
    username: 'ada',
    status,
  }) as IUser;

const makePrefs = (overrides: Partial<INotificationPref> = {}): INotificationPref => ({
  emailDigest: false,
  pushEnabled: false,
  smsEnabled: false,
  morningDigestEnabled: true,
  eveningDigestEnabled: false,
  streaksEnabled: false,
  morningHour: 8,
  eveningHour: 20,
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = makeUser();
  mockPrefs = makePrefs();
  mockPrefsLoading = false;
  mockOverride = null;
  mockUpdateProfile.mockReturnValue({ unwrap: () => Promise.resolve({}) });
  mockUpdatePreferences.mockReturnValue({ unwrap: () => Promise.resolve({}) });
});

describe('AccountCard', () => {
  it('prefills the form from the current user', async () => {
    await render(<AccountCard />);

    expect(screen.getByTestId('account-first-name').props.value).toBe('Ada');
    expect(screen.getByTestId('account-last-name').props.value).toBe('Lovelace');
  });

  it('shows email and username read-only', async () => {
    await render(<AccountCard />);

    expect(screen.getByText('a@b.test')).toBeTruthy();
    expect(screen.getByText('ada')).toBeTruthy();
  });

  it('submits the edited name', async () => {
    await render(<AccountCard />);

    await fireEvent.changeText(screen.getByTestId('account-first-name'), 'Grace');
    await fireEvent.press(screen.getByTestId('account-save'));

    await waitFor(() => expect(mockUpdateProfile).toHaveBeenCalledWith({ firstName: 'Grace', lastName: 'Lovelace' }));
  });
});

describe('ThemeCard', () => {
  it('marks System as selected when there is no override', async () => {
    await render(<ThemeCard />);

    expect(screen.getByTestId('theme-system').props.accessibilityState.selected).toBe(true);
    expect(screen.getByTestId('theme-dark').props.accessibilityState.selected).toBe(false);
  });

  it('persists an explicit dark choice', async () => {
    await render(<ThemeCard />);

    await fireEvent.press(screen.getByTestId('theme-dark'));

    expect(mockSetOverride).toHaveBeenCalledWith('dark');
  });

  it('clears the override back to system', async () => {
    mockOverride = 'dark';
    await render(<ThemeCard />);

    await fireEvent.press(screen.getByTestId('theme-system'));

    // null means "follow the system" — not a third stored value.
    expect(mockSetOverride).toHaveBeenCalledWith(null);
  });
});

describe('NotificationsCard', () => {
  it('shows skeleton rows while preferences load', async () => {
    mockPrefsLoading = true;

    await render(<NotificationsCard />);

    expect(screen.getByTestId('notifications-loading')).toBeTruthy();
  });

  it('auto-saves a free toggle without a save button', async () => {
    await render(<NotificationsCard />);

    await fireEvent.press(screen.getByTestId('pref-morning-digest-switch'));

    await waitFor(() => expect(mockUpdatePreferences).toHaveBeenCalledWith({ morningDigestEnabled: false }));
  });

  it('locks Pro rows for a free user and does not write', async () => {
    await render(<NotificationsCard />);

    await fireEvent.press(screen.getByTestId('pref-streaks'));

    expect(mockUpdatePreferences).not.toHaveBeenCalled();
  });

  it('unlocks Pro rows for a premium user', async () => {
    mockUser = makeUser('premium');
    mockPrefs = makePrefs({ streaksEnabled: true });

    await render(<NotificationsCard />);

    // A pro user's row is a plain View, so pressing it does nothing; the
    // absence of the lock is what matters.
    expect(screen.queryByText('Pro')).toBeNull();
  });
});
