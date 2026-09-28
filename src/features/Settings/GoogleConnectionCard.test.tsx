import type { IUser } from '@nicoflow/shared/types';
import { render, screen } from '@testing-library/react-native';

import { GoogleConnectionCard } from './GoogleConnectionCard';

let mockUser: IUser;
const mockCalendarsQuery = jest.fn();
const mockCalendarListQuery = jest.fn();

jest.mock('@/lib/store', () => ({
  useAppUser: () => mockUser,
  useGetGoogleConnectionQuery: (...args: unknown[]) => mockCalendarsQuery(...args),
  useGetGoogleCalendarsQuery: (...args: unknown[]) => mockCalendarListQuery(...args),
  useLazyGetGoogleAuthUrlQuery: () => [jest.fn(), { isLoading: false }],
  useDisconnectGoogleMutation: () => [jest.fn(), { isLoading: false }],
  useUpdateGoogleCalendarSelectionMutation: () => [jest.fn(), { isLoading: false }],
}));

const makeUser = (status: IUser['status']): IUser => ({ id: 'u1', email: 'a@b.test', status }) as IUser;

beforeEach(() => {
  jest.clearAllMocks();
  mockUser = makeUser('regular');
  mockCalendarsQuery.mockReturnValue({});
  mockCalendarListQuery.mockReturnValue({});
});

describe('GoogleConnectionCard', () => {
  it('does not render or request Google data for a free user', async () => {
    await render(<GoogleConnectionCard />);

    expect(screen.queryByTestId('settings-google-calendar-card')).toBeNull();
    expect(mockCalendarsQuery).not.toHaveBeenCalled();
  });

  it('shows the connection loading state for Pro users', async () => {
    mockUser = makeUser('premium');
    mockCalendarsQuery.mockReturnValue({ isLoading: true });

    await render(<GoogleConnectionCard />);

    expect(screen.getByTestId('google-calendar-loading')).toBeTruthy();
    expect(mockCalendarsQuery).toHaveBeenCalledWith(undefined);
  });

  it('offers connect when no Google connection exists', async () => {
    mockUser = makeUser('premium');
    mockCalendarsQuery.mockReturnValue({
      isError: true,
      error: { status: 409, data: { error: { code: 'GOOGLE_NOT_CONNECTED' } } },
    });

    await render(<GoogleConnectionCard />);

    expect(screen.getByTestId('google-calendar-connect')).toBeTruthy();
  });

  it('keeps recoverable connection errors on a retry path', async () => {
    mockUser = makeUser('premium');
    mockCalendarsQuery.mockReturnValue({ isError: true, error: { status: 'FETCH_ERROR' }, refetch: jest.fn() });

    await render(<GoogleConnectionCard />);

    expect(screen.queryByTestId('google-calendar-connect')).toBeNull();
    expect(screen.getByText('Retry')).toBeTruthy();
  });
});
