import type { IBucket } from '@nicoflow/shared/types';
import { render, screen } from '@testing-library/react-native';

import { ArchivedList } from './ArchivedList';

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

describe('ArchivedList', () => {
  it('AC4: shows the empty state when nothing is archived', async () => {
    await render(<ArchivedList items={[]} isLoading={false} />);
    expect(screen.getByTestId('archived-empty')).toBeTruthy();
  });

  it('AC1/AC2/AC3: renders an archived item with its processing-result badge', async () => {
    await render(<ArchivedList items={[bucket({ processingResult: 'note' })]} isLoading={false} />);
    expect(screen.getByTestId('archived-bucket-b1')).toBeTruthy();
    expect(screen.getByText('Note')).toBeTruthy();
    expect(screen.getByText('Buy milk')).toBeTruthy();
  });

  it('shows a relative "processed" timestamp', async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
    await render(<ArchivedList items={[bucket({ processedAt: twoDaysAgo })]} isLoading={false} />);
    expect(screen.getByText(/Processed 2 days ago/)).toBeTruthy();
  });
});
