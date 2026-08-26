import { router } from 'expo-router';

import type { IBucket } from '@nicoflow/shared/types';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ArchivedList } from './ArchivedList';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

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

  it('navigates to the task deep-link route when "view what this became" is pressed', async () => {
    await render(
      <ArchivedList items={[bucket({ processingResult: 'task', createdTaskId: 'task-1' })]} isLoading={false} />
    );
    await fireEvent.press(screen.getByTestId('bucket-view-created'));
    expect(router.push).toHaveBeenCalledWith('/task/task-1');
  });

  it('navigates to the note route when "view what this became" is pressed', async () => {
    await render(
      <ArchivedList items={[bucket({ processingResult: 'note', createdNoteId: 'note-1' })]} isLoading={false} />
    );
    await fireEvent.press(screen.getByTestId('bucket-view-created'));
    expect(router.push).toHaveBeenCalledWith('/note/note-1');
  });

  it('renders no "view what this became" link when trashed', async () => {
    await render(<ArchivedList items={[bucket({ processingResult: 'trash' })]} isLoading={false} />);
    expect(screen.queryByTestId('bucket-view-created')).toBeNull();
  });
});
