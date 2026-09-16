import { fireEvent, render, screen } from '@testing-library/react-native';

import { Switch } from './switch';

describe('Switch', () => {
  it('reports its checked and disabled state to assistive tech', async () => {
    await render(<Switch checked disabled onCheckedChange={jest.fn()} testID="s" />);

    expect(screen.getByTestId('s').props.accessibilityState).toEqual({ checked: true, disabled: true });
  });

  it('toggles to the opposite value on press', async () => {
    const onCheckedChange = jest.fn();
    await render(<Switch checked={false} onCheckedChange={onCheckedChange} testID="s" />);

    await fireEvent.press(screen.getByTestId('s'));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('ignores presses while disabled', async () => {
    const onCheckedChange = jest.fn();
    await render(<Switch checked={false} disabled onCheckedChange={onCheckedChange} testID="s" />);

    await fireEvent.press(screen.getByTestId('s'));

    expect(onCheckedChange).not.toHaveBeenCalled();
  });
});

describe('interpolateColor arguments', () => {
  // This suite mocks reanimated, so a misuse still renders green here — which is
  // how nesting withTiming *inside* interpolateColor shipped and then crashed
  // the app whenever Settings rendered a Switch. Pin the real behaviour:
  // withTiming returns an animation object, and interpolateColor given one
  // yields an unparseable colour that the native side throws on, in a worklet,
  // on the UI thread — an abort with no JS stack.
  it('yields an unusable colour when handed an animation object', () => {
    const { interpolateColor, withTiming } =
      jest.requireActual<typeof import('react-native-reanimated')>('react-native-reanimated');

    const animation = withTiming(1, { duration: 150 }) as unknown as number;

    expect(interpolateColor(animation, [0, 1], ['#000000', '#ffffff'])).toBe('rgba(NaN, NaN, NaN, NaN)');
    expect(interpolateColor(1, [0, 1], ['#000000', '#ffffff'])).toBe('rgba(255, 255, 255, 1)');
  });
});
