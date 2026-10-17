import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CommandPalette from '../../renderer/components/CommandPalette/CommandPalette';
import { ConfigProvider } from '../../renderer/contexts/ConfigContext';

const configStoreSet = jest.fn();

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
  configStoreSet.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(window, 'electron', {
    configurable: true,
    value: {
      platform: 'darwin',
      configStore: {
        getAll: jest.fn().mockResolvedValue({}),
        set: configStoreSet,
      },
    },
  });
});

describe('CommandPalette', () => {
  it('focuses the input when opened', async () => {
    renderCommandPalette();

    fireEvent.click(
      await screen.findByRole('button', { name: /Open Command Palette/ }),
    );

    expect(
      await screen.findByPlaceholderText('Type a command or search...'),
    ).toHaveFocus();
  });

  it('selects command items with arrow keys and Enter', async () => {
    renderCommandPalette();

    fireEvent.click(
      await screen.findByRole('button', { name: /Open Command Palette/ }),
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

  it('clears the search when entering a submenu from filtered results', async () => {
    renderCommandPalette();

    fireEvent.click(
      await screen.findByRole('button', { name: /Open Command Palette/ }),
    );
    const input = await screen.findByPlaceholderText(
      'Type a command or search...',
    );

    fireEvent.change(input, { target: { value: 'Change theme' } });
    fireEvent.click(screen.getByRole('option', { name: 'Change theme' }));

    expect(input).toHaveValue('');
    expect(
      screen.getByRole('option', { name: 'Change theme to light' }),
    ).toBeVisible();
    expect(
      screen.getByRole('option', { name: 'Change theme to dark' }),
    ).toBeVisible();
    expect(
      screen.getByRole('option', { name: 'Change theme to system' }),
    ).toBeVisible();
    expect(screen.queryByText('No results found.')).not.toBeInTheDocument();
  });

  it('shows matching submenu commands when searching from the main menu', async () => {
    renderCommandPalette();

    fireEvent.click(
      await screen.findByRole('button', { name: /Open Command Palette/ }),
    );
    const input = await screen.findByPlaceholderText(
      'Type a command or search...',
    );

    fireEvent.change(input, { target: { value: 'dark' } });

    expect(
      await screen.findByRole('option', { name: 'Change theme to dark' }),
    ).toBeVisible();
    expect(screen.queryByText('No results found.')).not.toBeInTheDocument();
  });

  it('clears the search after selecting a filtered theme option', async () => {
    renderCommandPalette();

    fireEvent.click(
      await screen.findByRole('button', { name: /Open Command Palette/ }),
    );
    const input = await screen.findByPlaceholderText(
      'Type a command or search...',
    );

    fireEvent.change(input, { target: { value: 'Change theme' } });
    fireEvent.click(screen.getByRole('option', { name: 'Change theme' }));
    fireEvent.change(input, { target: { value: 'dark' } });
    fireEvent.click(
      screen.getByRole('option', { name: 'Change theme to dark' }),
    );

    await waitFor(() => {
      expect(configStoreSet).toHaveBeenCalledWith('theme', 'dark');
    });
    expect(input).toHaveValue('');
    expect(screen.queryByText('No results found.')).not.toBeInTheDocument();
  });
});
