import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Appearance } from 'react-native';

import { ThemeOverrideProvider } from './ThemeOverrideProvider';
import { ThemeToggle } from '@/features/Tabs/ThemeToggle';

const renderToggle = () =>
  render(
    <ThemeOverrideProvider>
      <ThemeToggle />
    </ThemeOverrideProvider>
  );

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.spyOn(Appearance, 'setColorScheme').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ThemeOverrideProvider + ThemeToggle', () => {
  it('persists an explicit choice and applies it via Appearance.setColorScheme', async () => {
    await renderToggle();

    fireEvent.press(screen.getByText('Dark'));

    expect(Appearance.setColorScheme).toHaveBeenCalledWith('dark');
    await waitFor(async () => {
      expect(await AsyncStorage.getItem('nicoflow.themeOverride')).toBe('dark');
    });
  });

  it('restores a persisted override on mount', async () => {
    await AsyncStorage.setItem('nicoflow.themeOverride', 'light');

    await renderToggle();

    await waitFor(() => {
      expect(Appearance.setColorScheme).toHaveBeenCalledWith('light');
    });
  });

  it('clears the override back to system and removes the stored value', async () => {
    await AsyncStorage.setItem('nicoflow.themeOverride', 'dark');
    await renderToggle();

    fireEvent.press(screen.getByText('System'));

    expect(Appearance.setColorScheme).toHaveBeenLastCalledWith(null);
    await waitFor(async () => {
      expect(await AsyncStorage.getItem('nicoflow.themeOverride')).toBeNull();
    });
  });
});
