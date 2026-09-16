import { render, screen, userEvent } from '@testing-library/react-native';

import { SearchButton } from './SearchButton';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (href: string) => mockPush(href) } }));

beforeEach(() => mockPush.mockClear());

describe('SearchButton', () => {
  it('opens the search screen', async () => {
    await render(<SearchButton />);

    await userEvent.press(screen.getByTestId('search-button'));

    expect(mockPush).toHaveBeenCalledWith('/search');
  });

  it('is labelled for screen readers', async () => {
    await render(<SearchButton />);

    // common:search.hintTitle — the key More/data.ts already uses for this row.
    expect(screen.getByLabelText('Search everything')).toBeTruthy();
  });
});
