import { render, screen } from '@testing-library/react-native';

import { PlanLimitAlert } from './plan-limit-alert';

describe('PlanLimitAlert', () => {
  it('renders the generic plan-limit copy by default', async () => {
    await render(<PlanLimitAlert />);

    expect(screen.getByText("You've hit your Free limit")).toBeTruthy();
    expect(screen.getByText('Upgrade to Pro for unlimited areas, projects, AI and more.')).toBeTruthy();
    expect(screen.getByText('Upgrade to Pro')).toBeTruthy();
  });

  it('renders an overridden message for a resource-specific variant (e.g. timed scheduling)', async () => {
    await render(
      <PlanLimitAlert message="Timed scheduling is a Pro feature. Upgrade to drag tasks to a specific time." />
    );

    expect(screen.getByText("You've hit your Free limit")).toBeTruthy();
    expect(
      screen.getByText('Timed scheduling is a Pro feature. Upgrade to drag tasks to a specific time.')
    ).toBeTruthy();
    // The generic description must not also render alongside the override.
    expect(screen.queryByText('Upgrade to Pro for unlimited areas, projects, AI and more.')).toBeNull();
  });

  it('never wires the CTA to a purchase flow — no onPress/href/navigation prop exists on the component', async () => {
    // The component takes no CTA callback at all: (message?, testID?) is its
    // entire prop surface, so there is no way for a consumer to accidentally
    // wire it to an in-app purchase flow. This test documents that contract.
    await render(<PlanLimitAlert testID="plan-limit-alert-test" />);

    expect(screen.getByTestId('plan-limit-alert-test')).toBeTruthy();
  });
});
