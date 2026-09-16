import type { AIMessageView, AISessionDetailView } from '@nicoflow/shared/api';
import { render, screen } from '@testing-library/react-native';

import { AIChat } from './AIChat';
import type { PendingMessage } from './useAIStream';

jest.mock('@gorhom/bottom-sheet', () => require('@gorhom/bottom-sheet/mock'));

let mockSession: AISessionDetailView | undefined;
let mockPending: PendingMessage[] = [];
let mockIsStreaming = false;
const mockReset = jest.fn();

jest.mock('@/lib/store', () => ({
  useGetAISessionQuery: () => ({
    data: mockSession,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

jest.mock('./useAIQuota', () => ({
  useAIQuota: () => ({
    quota: { used: 1, limit: 500, state: 'ok' },
    isLoading: false,
    featureDisabled: false,
    hardenFromError: jest.fn(),
    isExhausted: false,
  }),
}));

jest.mock('./useAIStream', () => ({
  useAIStream: () => ({
    pending: mockPending,
    isStreaming: mockIsStreaming,
    send: jest.fn(),
    abort: jest.fn(),
    reset: mockReset,
  }),
}));

const persisted = (overrides: Partial<AIMessageView> = {}): AIMessageView => ({
  id: 'm1',
  role: 'user',
  content: 'How do I plan my week?',
  createdAt: '2026-09-01T10:00:00Z',
  ...overrides,
});

const session = (messages: AIMessageView[]): AISessionDetailView => ({
  id: 's1',
  title: 'Planning',
  createdAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-01T10:00:00Z',
  messages,
});

const pendingTurn = (overrides: Partial<PendingMessage> = {}): PendingMessage => ({
  id: 'local-1',
  role: 'user',
  content: 'How do I plan my week?',
  createdAt: '2026-09-01T10:00:00Z',
  status: 'done',
  ...overrides,
});

beforeEach(() => {
  mockSession = undefined;
  mockPending = [];
  mockIsStreaming = false;
  mockReset.mockClear();
});

describe('AIChat turn reconciliation', () => {
  it('renders a completed turn once after the session refetches', async () => {
    // The persisted assistant carries the server id the done event reported, so
    // the pending assistant matches by id and the user half by content.
    mockSession = session([persisted(), persisted({ id: 'm2', role: 'assistant', content: 'Start with your inbox.' })]);
    mockPending = [pendingTurn(), pendingTurn({ id: 'm2', role: 'assistant', content: 'Start with your inbox.' })];

    await render(<AIChat sessionId="s1" />);

    expect(screen.getAllByText('How do I plan my week?')).toHaveLength(1);
    expect(screen.getAllByText('Start with your inbox.')).toHaveLength(1);
  });

  it('keeps an in-flight turn visible before it is persisted', async () => {
    mockSession = session([]);
    mockIsStreaming = true;
    mockPending = [
      pendingTurn({ status: 'sending' }),
      pendingTurn({ id: 'local-2', role: 'assistant', content: 'Start', status: 'streaming' }),
    ];

    await render(<AIChat sessionId="s1" />);

    expect(screen.getAllByText('How do I plan my week?')).toHaveLength(1);
    expect(screen.getAllByText('Start')).toHaveLength(1);
  });

  it('clears local turns once the assistant is persisted and the stream is done', async () => {
    mockSession = session([persisted({ id: 'm2', role: 'assistant', content: 'Start with your inbox.' })]);
    mockPending = [pendingTurn({ id: 'm2', role: 'assistant', content: 'Start with your inbox.' })];

    await render(<AIChat sessionId="s1" />);

    expect(mockReset).toHaveBeenCalled();
  });

  it('does not clear local turns while the stream is still open', async () => {
    mockSession = session([]);
    mockIsStreaming = true;
    mockPending = [pendingTurn({ id: 'local-2', role: 'assistant', content: 'Partial', status: 'streaming' })];

    await render(<AIChat sessionId="s1" />);

    expect(mockReset).not.toHaveBeenCalled();
  });

  it('renders no bubble for a finished turn that streamed no text', async () => {
    mockSession = session([]);
    mockPending = [pendingTurn({ id: 'local-2', role: 'assistant', content: '', status: 'done' })];

    await render(<AIChat sessionId="s1" />);

    expect(screen.queryByTestId('ai-message-local-2')).toBeNull();
  });
});
