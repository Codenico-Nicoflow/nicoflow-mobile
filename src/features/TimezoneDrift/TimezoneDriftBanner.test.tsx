import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { clearDriftDismissal } from './dismissal';
import { TimezoneDriftBanner } from './TimezoneDriftBanner';

const mockUpdateProfile = jest.fn(() => ({ unwrap: () => Promise.resolve({}) }));
let mockUser: { timezone?: string } | null = { timezone: 'Asia/Jerusalem' };

jest.mock('@/lib/store', () => ({
  useAppUser: () => mockUser,
  useUpdateProfileMutation: () => [mockUpdateProfile, { isLoading: false }],
}));

function mockDeviceTimeZone(timeZone: string) {
  const RealDateTimeFormat = Intl.DateTimeFormat;
  return jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
    (...args: ConstructorParameters<typeof Intl.DateTimeFormat>) => {
      const [locale, options] = args;
      const instance = new RealDateTimeFormat(locale, options);
      if (options?.timeZone) return instance;
      return {
        ...instance,
        resolvedOptions: () => ({ ...instance.resolvedOptions(), timeZone }),
      } as Intl.DateTimeFormat;
    }
  );
}

describe('TimezoneDriftBanner', () => {
  beforeEach(async () => {
    await clearDriftDismissal();
    mockUpdateProfile.mockClear();
    mockUser = { timezone: 'Asia/Jerusalem' };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders nothing when the device zone matches the account zone', async () => {
    mockDeviceTimeZone('Asia/Jerusalem');

    await render(<TimezoneDriftBanner />);
    expect(screen.queryByText('Your calendar is showing a different timezone')).toBeNull();
  });

  it('renders nothing when the user has no stored timezone', async () => {
    mockUser = {};
    mockDeviceTimeZone('America/New_York');

    await render(<TimezoneDriftBanner />);
    expect(screen.queryByText('Your calendar is showing a different timezone')).toBeNull();
  });

  it('renders the mismatch when the device zone differs', async () => {
    mockDeviceTimeZone('America/New_York');

    await render(<TimezoneDriftBanner />);
    await waitFor(() => expect(screen.getByText('Your calendar is showing a different timezone')).toBeTruthy());
  });

  it('dismiss button hides the banner and persists the dismissal', async () => {
    mockDeviceTimeZone('America/New_York');

    await render(<TimezoneDriftBanner />);
    await waitFor(() => expect(screen.getByText('Your calendar is showing a different timezone')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Keep account timezone'));

    await waitFor(() => expect(screen.queryByText('Your calendar is showing a different timezone')).toBeNull());
  });
});
