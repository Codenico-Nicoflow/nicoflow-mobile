import type { QuotaStatus } from '@nicoflow/shared/utils';
import { render, screen } from '@testing-library/react-native';

import { QuotaIndicator } from './QuotaIndicator';
import { QuotaWall } from './QuotaWall';

const freeExhausted: QuotaStatus = {
  state: 'exhausted',
  used: 5,
  limit: 5,
  scope: 'lifetime',
  canUpgrade: true,
  percent: 100,
};

const proExhausted: QuotaStatus = {
  state: 'exhausted',
  used: 500,
  limit: 500,
  scope: 'month',
  canUpgrade: false,
  percent: 100,
};

const ok: QuotaStatus = { state: 'ok', used: 2, limit: 5, scope: 'lifetime', canUpgrade: false, percent: 40 };

describe('QuotaWall', () => {
  it('shows the upgrade hint when a free lifetime cap is hit', async () => {
    await render(<QuotaWall quota={freeExhausted} />);

    expect(screen.getByTestId('ai-quota-wall')).toBeTruthy();
    expect(screen.getByTestId('ai-quota-upgrade-hint')).toBeTruthy();
  });

  it('offers no in-app purchase button on the free wall (reader-app posture)', async () => {
    await render(<QuotaWall quota={freeExhausted} />);

    // The hint is plain text pointing at the web app, never a pressable CTA.
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows a reset notice and no upsell when a pro monthly cap is hit', async () => {
    await render(<QuotaWall quota={proExhausted} />);

    expect(screen.getByTestId('ai-quota-reset-notice')).toBeTruthy();
    expect(screen.queryByTestId('ai-quota-wall')).toBeNull();
    expect(screen.queryByTestId('ai-quota-upgrade-hint')).toBeNull();
  });
});

describe('QuotaIndicator', () => {
  it('renders nothing when the usage read failed so no misleading 0 / 0 shows', async () => {
    await render(<QuotaIndicator quota={undefined} />);

    expect(screen.queryByTestId('ai-quota-indicator')).toBeNull();
  });

  it('labels a free quota with its lifetime copy', async () => {
    await render(<QuotaIndicator quota={ok} />);

    expect(screen.getByTestId('ai-quota-label')).toHaveTextContent('2 / 5 free messages');
  });

  it('labels a pro quota with its monthly copy', async () => {
    await render(<QuotaIndicator quota={proExhausted} />);

    expect(screen.getByTestId('ai-quota-label')).toHaveTextContent('500 / 500 this month');
  });

  it('exposes the meter as a progressbar with the real bounds', async () => {
    await render(<QuotaIndicator quota={ok} />);

    expect(screen.getByTestId('ai-quota-meter').props.accessibilityValue).toEqual({ min: 0, max: 5, now: 2 });
  });
});
