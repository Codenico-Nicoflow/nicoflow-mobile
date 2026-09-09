import { fireEvent, render, screen } from '@testing-library/react-native';

import { StorageBar } from './StorageBar';
import { UploadProgressRow } from './UploadProgressRow';
import type { UploadItem } from './useAttachmentUpload';

const item = (overrides: Partial<UploadItem> = {}): UploadItem => ({
  id: 'u1',
  name: 'photo.jpg',
  status: 'uploading',
  progress: 0.5,
  file: { uri: 'file:///a.jpg', name: 'photo.jpg', mimeType: 'image/jpeg', size: 1024 },
  ...overrides,
});

describe('UploadProgressRow', () => {
  it('renders a determinate bar at the reported ratio', async () => {
    await render(<UploadProgressRow item={item({ progress: 0.42 })} onRetry={jest.fn()} onRemove={jest.fn()} />);

    expect(screen.getByTestId('attachment-progress-u1').props.accessibilityValue).toEqual({
      min: 0,
      max: 100,
      now: 42,
    });
    expect(screen.getByText('42%')).toBeTruthy();
  });

  it.each([
    [0, 0],
    [1, 100],
    // A ratio slightly over 1 would otherwise render a bar wider than its track.
    [1.5, 100],
  ])('clamps a ratio of %s to %s percent', async (progress, expected) => {
    await render(<UploadProgressRow item={item({ progress })} onRetry={jest.fn()} onRemove={jest.fn()} />);

    expect(screen.getByTestId('attachment-progress-u1').props.accessibilityValue.now).toBe(expected);
  });

  it('replaces the bar with retry and remove once it fails', async () => {
    await render(<UploadProgressRow item={item({ status: 'error' })} onRetry={jest.fn()} onRemove={jest.fn()} />);

    expect(screen.queryByTestId('attachment-progress-u1')).toBeNull();
    expect(screen.getByTestId('attachment-retry-u1')).toBeTruthy();
    expect(screen.getByTestId('attachment-remove-u1')).toBeTruthy();
  });

  it('retries the failed upload by id', async () => {
    const onRetry = jest.fn();
    await render(<UploadProgressRow item={item({ status: 'error' })} onRetry={onRetry} onRemove={jest.fn()} />);

    await fireEvent.press(screen.getByTestId('attachment-retry-u1'));

    expect(onRetry).toHaveBeenCalledWith('u1');
  });

  it('removes the failed upload by id', async () => {
    const onRemove = jest.fn();
    await render(<UploadProgressRow item={item({ status: 'error' })} onRetry={jest.fn()} onRemove={onRemove} />);

    await fireEvent.press(screen.getByTestId('attachment-remove-u1'));

    expect(onRemove).toHaveBeenCalledWith('u1');
  });

  it('offers no purchase affordance on a failed upload', async () => {
    const view = await render(
      <UploadProgressRow
        item={item({ status: 'error', errorCode: 'STORAGE_LIMIT_EXCEEDED' })}
        onRetry={jest.fn()}
        onRemove={jest.fn()}
      />
    );

    // Reader-app posture: a quota failure informs, it never sells (E-037).
    expect(screen.queryByRole('link')).toBeNull();
    expect(JSON.stringify(view.toJSON())).not.toContain('Upgrade to Pro');
  });
});

describe('StorageBar', () => {
  it('renders the used-of-total label and a proportional fill', async () => {
    await render(<StorageBar usedBytes={50 * 1024 * 1024} limitBytes={100 * 1024 * 1024} />);

    expect(screen.getByTestId('attachment-storage-fill').props.accessibilityValue.now).toBe(50);
    expect(screen.getByText('50 MB of 100 MB')).toBeTruthy();
  });

  it('never divides by a zero limit', async () => {
    await render(<StorageBar usedBytes={10} limitBytes={0} />);

    // A bad payload must not produce NaN or Infinity width.
    expect(screen.getByTestId('attachment-storage-fill').props.accessibilityValue.now).toBe(0);
  });

  it('clamps usage over the cap to a full bar', async () => {
    await render(<StorageBar usedBytes={200} limitBytes={100} />);

    expect(screen.getByTestId('attachment-storage-fill').props.accessibilityValue.now).toBe(100);
  });
});
