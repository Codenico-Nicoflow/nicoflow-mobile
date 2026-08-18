import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { CustomTabBar } from './CustomTabBar';
import { MOBILE_NAV_DESTINATIONS } from './data';

function makeProps(activeIndex: number, overrides?: Partial<BottomTabBarProps>): BottomTabBarProps {
  const routes = MOBILE_NAV_DESTINATIONS.map(d => ({ key: d.id, name: d.id, params: undefined }));
  const emit = jest.fn(() => ({ defaultPrevented: false }));
  const navigate = jest.fn();

  return {
    state: {
      index: activeIndex,
      routes,
      routeNames: routes.map(r => r.name),
      key: 'tab-state',
      type: 'tab',
      stale: false,
      history: [],
    } as unknown as BottomTabBarProps['state'],
    descriptors: {} as BottomTabBarProps['descriptors'],
    navigation: { emit, navigate } as unknown as BottomTabBarProps['navigation'],
    insets: { top: 0, bottom: 0, left: 0, right: 0 },
    ...overrides,
  } as BottomTabBarProps;
}

describe('CustomTabBar', () => {
  it('renders all 5 destination labels', async () => {
    await render(<CustomTabBar {...makeProps(0)} />);

    for (const destination of MOBILE_NAV_DESTINATIONS) {
      expect(screen.getByText(destination.label)).toBeTruthy();
    }
  });

  it('marks the active tab as selected via accessibilityState', async () => {
    await render(<CustomTabBar {...makeProps(1)} />);

    const inboxTab = screen.getByLabelText('Inbox');
    expect(inboxTab.props.accessibilityState).toEqual(expect.objectContaining({ selected: true }));

    const todayTab = screen.getByLabelText('Today');
    expect(todayTab.props.accessibilityState).toEqual(expect.objectContaining({ selected: false }));
  });

  it('pressing an inactive tab navigates to it', async () => {
    const props = makeProps(0);
    await render(<CustomTabBar {...props} />);

    fireEvent.press(screen.getByLabelText('Areas'));

    expect(props.navigation.navigate).toHaveBeenCalledWith('areas');
  });

  it('pressing the already-active tab does not navigate again', async () => {
    const props = makeProps(0);
    await render(<CustomTabBar {...props} />);

    fireEvent.press(screen.getByLabelText('Today'));

    expect(props.navigation.navigate).not.toHaveBeenCalled();
  });
});
