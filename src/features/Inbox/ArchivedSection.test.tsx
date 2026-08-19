import type { IBucket } from '@nicoflow/shared/types';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ArchivedSection } from './ArchivedSection';

const bucket = (overrides: Partial<IBucket> = {}): IBucket => ({
  id: 'b1',
  userId: 'u1',
  content: 'Buy milk',
  processedAt: '2026-08-19T00:00:00.000Z',
  processingResult: 'task',
  createdAt: '',
  updatedAt: '',
  ...overrides,
});

describe('ArchivedSection', () => {
  it('renders nothing when there are no archived items', async () => {
    await render(<ArchivedSection items={[]} />);
    expect(screen.queryByText(/Archived/)).toBeNull();
  });

  it('AC4: collapses by default and expands on tap', async () => {
    await render(<ArchivedSection items={[bucket()]} />);

    expect(screen.getByText('Archived (1)')).toBeTruthy();
    expect(screen.queryByTestId('archived-bucket-b1')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { expanded: false }));

    expect(screen.getByTestId('archived-bucket-b1')).toBeTruthy();
  });
});
