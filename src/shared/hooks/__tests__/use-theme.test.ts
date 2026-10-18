import React from 'react';
import * as ReactNative from 'react-native';
import renderer from 'react-test-renderer';

import { colors, spacing } from '@/config/theme';

import { useAppTheme } from '../use-theme';

function ThemeConsumer({ onTheme }: { onTheme: (theme: ReturnType<typeof useAppTheme>) => void }) {
  const theme = useAppTheme();
  onTheme(theme);
  return null;
}

describe('useAppTheme', () => {
  let colorSchemeSpy: jest.SpyInstance;

  beforeEach(() => {
    colorSchemeSpy = jest.spyOn(ReactNative, 'useColorScheme');
  });

  afterEach(() => {
    colorSchemeSpy.mockRestore();
  });

  it('returns dark theme when system color scheme is dark', () => {
    colorSchemeSpy.mockReturnValue('dark');
    let capturedTheme: ReturnType<typeof useAppTheme> | undefined;

    renderer.act(() => {
      renderer.create(
        React.createElement(ThemeConsumer, {
          onTheme: (theme) => {
            capturedTheme = theme;
          },
        })
      );
    });

    expect(capturedTheme).toBeDefined();
    expect(capturedTheme?.isDark).toBe(true);
    expect(capturedTheme?.colors.background).toBe(colors.dark.background);
    expect(capturedTheme?.spacing).toEqual(spacing);
  });

  it('returns dark theme as default when system color scheme is null/undefined (hackathon look)', () => {
    colorSchemeSpy.mockReturnValue(null);
    let capturedTheme: ReturnType<typeof useAppTheme> | undefined;

    renderer.act(() => {
      renderer.create(
        React.createElement(ThemeConsumer, {
          onTheme: (theme) => {
            capturedTheme = theme;
          },
        })
      );
    });

    expect(capturedTheme).toBeDefined();
    expect(capturedTheme?.isDark).toBe(true);
    expect(capturedTheme?.colors.background).toBe(colors.dark.background);

    // Also test undefined
    colorSchemeSpy.mockReturnValue(undefined);
    renderer.act(() => {
      renderer.create(
        React.createElement(ThemeConsumer, {
          onTheme: (theme) => {
            capturedTheme = theme;
          },
        })
      );
    });

    expect(capturedTheme?.isDark).toBe(true);
  });

  it('returns light theme when system color scheme is explicitly light', () => {
    colorSchemeSpy.mockReturnValue('light');
    let capturedTheme: ReturnType<typeof useAppTheme> | undefined;

    renderer.act(() => {
      renderer.create(
        React.createElement(ThemeConsumer, {
          onTheme: (theme) => {
            capturedTheme = theme;
          },
        })
      );
    });

    expect(capturedTheme).toBeDefined();
    expect(capturedTheme?.isDark).toBe(false);
    expect(capturedTheme?.colors.background).toBe(colors.light.background);
  });
});
