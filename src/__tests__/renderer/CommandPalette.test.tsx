import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CommandPalette from '../../renderer/components/CommandPalette/CommandPalette';
import { ConfigProvider } from '../../renderer/contexts/ConfigContext';

function renderCommandPalette() {
  render(
    <ConfigProvider>
      <CommandPalette />
    </ConfigProvider>,
  );
}

afterEach(() => {
  jest.restoreAllMocks();
});

beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn();
  Object.defineProperty(window, 'electron', {
    configurable: true,
    value: { platform: 'darwin' },
  });
});

describe('CommandPalette', () => {
  it('focuses the input when opened', async () => {
    renderCommandPalette();

    fireEvent.click(
      screen.getByRole('button', { name: /Open Command Palette/ }),
    );

    expect(
      await screen.findByPlaceholderText('Type a command or search...'),
    ).toHaveFocus();
  });

  it('selects command items with arrow keys and Enter', async () => {
    renderCommandPalette();

    fireEvent.click(
      screen.getByRole('button', { name: /Open Command Palette/ }),
    );
    const input = await screen.findByPlaceholderText(
      'Type a command or search...',
    );
    const selectedBefore = screen.getByRole('option', {
      selected: true,
    });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(screen.getByRole('option', { selected: true })).not.toBe(
        selectedBefore,
      );
    });

    fireEvent.keyDown(input, { key: 'Enter' });
  });
});
