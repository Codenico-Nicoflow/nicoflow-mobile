import type { IUser } from '@nicoflow/shared/types';
import { render, screen } from '@testing-library/react-native';

import { PlanCard } from './PlanCard';

let mockUser: IUser;

jest.mock('@/lib/store', () => ({
  useAppUser: () => mockUser,
}));

const makeUser = (status: IUser['status']): IUser =>
  ({
    id: 'u1',
    email: 'a@b.test',
    firstName: 'A',
    lastName: 'B',
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    imageUrl: '',
    username: 'ab',
    status,
  }) as IUser;

describe('PlanCard', () => {
  it('shows the Free badge and the web-upgrade hint for a free user', async () => {
    mockUser = makeUser('regular');

    await render(<PlanCard />);

    expect(screen.getByText('Free plan')).toBeTruthy();
    expect(screen.getByTestId('plan-upgrade-hint')).toBeTruthy();
  });

  it('shows the Pro badge and no upgrade hint for a pro user', async () => {
    mockUser = makeUser('premium');

    await render(<PlanCard />);

    expect(screen.getByText('Pro plan')).toBeTruthy();
    expect(screen.queryByTestId('plan-upgrade-hint')).toBeNull();
  });

  // The reader-app rule (E-037): this screen must never offer an in-app
  // purchase. No button, no link, and nothing that could reach a checkout —
  // asserted for BOTH plans, since a regression would most likely add a CTA to
  // the free branch only.
  it.each([['regular'], ['premium']] as const)('offers no purchase affordance for a %s user', async status => {
    mockUser = makeUser(status);

    const view = await render(<PlanCard />);

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
    expect(JSON.stringify(view.toJSON())).not.toContain('onPress');
  });
});
