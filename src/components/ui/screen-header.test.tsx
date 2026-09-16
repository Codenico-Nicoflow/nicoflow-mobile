import { Text } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { ScreenHeader } from './screen-header';

describe('ScreenHeader', () => {
  it('renders the title alone', async () => {
    await render(<ScreenHeader title="Your areas" />);

    expect(screen.getByText('Your areas')).toBeTruthy();
  });

  it('renders a string subtitle', async () => {
    await render(<ScreenHeader title="Inbox" subtitle="3 to process" />);

    expect(screen.getByText('3 to process')).toBeTruthy();
  });

  it('renders a node subtitle as given', async () => {
    await render(<ScreenHeader title="Inbox" subtitle={<Text>2 areas · 5 projects</Text>} />);

    expect(screen.getByText('2 areas · 5 projects')).toBeTruthy();
  });

  it('renders trailing actions', async () => {
    await render(<ScreenHeader title="Today" actions={<Text>action</Text>} />);

    expect(screen.getByText('action')).toBeTruthy();
  });
});
