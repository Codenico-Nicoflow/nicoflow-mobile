import { router } from 'expo-router';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { MORE_DESTINATIONS } from './data';
import { MoreList } from './MoreList';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MoreList', () => {
  it('renders a row for all 4 destinations', async () => {
    await render(<MoreList />);

    expect(MORE_DESTINATIONS).toHaveLength(4);
    for (const destination of MORE_DESTINATIONS) {
      expect(screen.getByTestId(`more-row-${destination.id}`)).toBeTruthy();
    }
  });

  it('labels each row with its translated section name', async () => {
    await render(<MoreList />);

    expect(screen.getByLabelText('AI')).toBeTruthy();
    expect(screen.getByLabelText('Search everything')).toBeTruthy();
    expect(screen.getByLabelText('Settings')).toBeTruthy();
    expect(screen.getByLabelText('Notifications')).toBeTruthy();
  });

  it.each(MORE_DESTINATIONS)('pressing $id pushes $href', async ({ id, href }) => {
    await render(<MoreList />);

    await fireEvent.press(screen.getByTestId(`more-row-${id}`));

    expect(router.push).toHaveBeenCalledWith(href);
  });

  it('drops the divider on the last row only', async () => {
    await render(<MoreList />);

    const rows = MORE_DESTINATIONS.map(d => screen.getByTestId(`more-row-${d.id}`));
    const dividerClasses = rows.map(row => String(row.props.className ?? ''));

    for (const className of dividerClasses.slice(0, -1)) {
      expect(className).toContain('border-b');
    }
    expect(dividerClasses.at(-1)).not.toContain('border-b');
  });
});
