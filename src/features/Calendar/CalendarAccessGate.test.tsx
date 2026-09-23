import { Text } from 'react-native';

import type { IUser } from '@nicoflow/shared/types';
import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { CalendarAccessGate } from './CalendarAccessGate';

type TestAuthState = {
  user: IUser | null;
  token: string | null;
};

let mockAuthState: TestAuthState;

jest.mock('@/lib/store', () => ({
  useAppSelector: (selector: (state: { auth: TestAuthState }) => unknown) => selector({ auth: mockAuthState }),
}));

const makeUser = (status: IUser['status'], id = 'u1'): IUser =>
  ({
    id,
    email: `${id}@example.test`,
    firstName: 'Calendar',
    lastName: 'User',
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    imageUrl: '',
    username: id,
    status,
  }) as IUser;

function renderGate(child: ReactNode = <Text>PRIVATE TASK TITLE</Text>) {
  return render(<CalendarAccessGate>{child}</CalendarAccessGate>);
}

describe('CalendarAccessGate', () => {
  it('shows a neutral state while the persisted session entitlement is unresolved', async () => {
    mockAuthState = { user: makeUser('premium'), token: null };

    await renderGate();

    expect(screen.getByTestId('calendar-entitlement-loading')).toBeTruthy();
    expect(screen.queryByText('PRIVATE TASK TITLE')).toBeNull();
    expect(screen.queryByTestId('calendar-free-teaser')).toBeNull();
  });

  it('shows only synthetic, inaccessible placeholders and reader-app copy for free users', async () => {
    mockAuthState = { user: makeUser('regular'), token: 'free-token' };

    const view = await renderGate();

    expect(screen.getByTestId('calendar-free-teaser')).toBeTruthy();
    expect(
      screen.getByTestId('calendar-synthetic-grid', { includeHiddenElements: true }).props.importantForAccessibility
    ).toBe('no-hide-descendants');
    expect(screen.getByTestId('calendar-upgrade-on-web')).toHaveTextContent('Upgrade on the web at nicoflow.app.');
    expect(screen.queryByText('PRIVATE TASK TITLE')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(JSON.stringify(view.toJSON())).not.toContain('onPress');
  });

  it('mounts the protected Calendar surface only for a verified Pro user', async () => {
    mockAuthState = { user: makeUser('premium'), token: 'pro-token' };

    await renderGate();

    expect(screen.getByText('PRIVATE TASK TITLE')).toBeTruthy();
    expect(screen.queryByTestId('calendar-free-teaser')).toBeNull();
  });

  it('removes protected content immediately when fresh entitlement downgrades the user', async () => {
    mockAuthState = { user: makeUser('premium'), token: 'token' };
    const view = await renderGate();
    expect(screen.getByText('PRIVATE TASK TITLE')).toBeTruthy();

    mockAuthState = { user: makeUser('regular'), token: 'token' };
    await view.rerender(
      <CalendarAccessGate>
        <Text>PRIVATE TASK TITLE</Text>
      </CalendarAccessGate>
    );

    expect(screen.queryByText('PRIVATE TASK TITLE')).toBeNull();
    expect(screen.getByTestId('calendar-free-teaser')).toBeTruthy();
  });

  it('never carries protected content across an account switch', async () => {
    mockAuthState = { user: makeUser('premium', 'account-a'), token: 'token-a' };
    const view = await renderGate();
    expect(screen.getByText('PRIVATE TASK TITLE')).toBeTruthy();

    mockAuthState = { user: makeUser('regular', 'account-b'), token: 'token-b' };
    await view.rerender(
      <CalendarAccessGate>
        <Text>PRIVATE TASK TITLE</Text>
      </CalendarAccessGate>
    );

    expect(screen.queryByText('PRIVATE TASK TITLE')).toBeNull();
    expect(screen.getByTestId('calendar-free-teaser')).toBeTruthy();
  });
});
