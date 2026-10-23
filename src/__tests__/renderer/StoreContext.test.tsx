import '@testing-library/jest-dom';
import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { useState } from 'react';
import {
  ConfigProvider,
  useConfig,
} from '../../renderer/contexts/StoreContext';

const mockGetAll = jest.fn();
const mockSet = jest.fn();

beforeAll(() => {
  global.window.electron = {
    configStoreClient: {
      getAll: mockGetAll,
      set: mockSet,
    },
  } as any;
});

beforeEach(() => {
  jest.clearAllMocks();
});

function TestComponent() {
  const { data, update } = useConfig();
  return (
    <div>
      <div data-testid="theme-value">{data.theme || 'no-theme'}</div>
      <button onClick={() => update('theme', 'dark')}>Change to Dark</button>
    </div>
  );
}

function ConfigValues() {
  const { data } = useConfig();
  return (
    <div>
      <div data-testid="theme-value">{data.theme}</div>
      <div data-testid="max-history">{data.maxHistory}</div>
      <div data-testid="window-width">{data.windowSize.width}</div>
    </div>
  );
}

describe('StoreContext & Provider', () => {
  it('displays a loading state while fetching config and then renders children', async () => {
    let resolveConfig: (value: any) => void = () => {};
    mockGetAll.mockReturnValue(
      new Promise((resolve) => {
        resolveConfig = resolve;
      }),
    );

    render(
      <ConfigProvider>
        <div data-testid="child">App Ready</div>
      </ConfigProvider>,
    );

    // Assert: Loading text is initially visible
    expect(screen.getByText(/loading config.../i)).toBeInTheDocument();
    expect(screen.queryByTestId('child')).not.toBeInTheDocument();

    await act(async () => {
      resolveConfig({ theme: 'light' });
    });

    // Assert: Loading state goes away, child app UI mounts
    expect(screen.queryByText(/loading config.../i)).not.toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('merges persisted values with defaults when the store is partially populated', async () => {
    mockGetAll.mockResolvedValue({ theme: 'light' });

    render(
      <ConfigProvider>
        <ConfigValues />
      </ConfigProvider>,
    );

    expect(await screen.findByTestId('theme-value')).toHaveTextContent('light');
    expect(screen.getByTestId('max-history')).toHaveTextContent('10000');
    expect(screen.getByTestId('window-width')).toHaveTextContent('600');
  });

  it('renders defaults when the store is empty', async () => {
    mockGetAll.mockResolvedValue({});

    render(
      <ConfigProvider>
        <ConfigValues />
      </ConfigProvider>,
    );

    expect(await screen.findByTestId('theme-value')).toHaveTextContent(
      'system',
    );
    expect(screen.getByTestId('max-history')).toHaveTextContent('10000');
  });

  it('logs load failures and renders defaults rather than remaining in loading state', async () => {
    const error = new Error('IPC unavailable');
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockGetAll.mockRejectedValue(error);

    render(
      <ConfigProvider>
        <ConfigValues />
      </ConfigProvider>,
    );

    expect(await screen.findByTestId('theme-value')).toHaveTextContent(
      'system',
    );
    expect(screen.queryByText(/loading config/i)).not.toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load store [Config]:',
      error,
    );

    consoleSpy.mockRestore();
  });

  it('optimistically updates state and triggers an Electron store write', async () => {
    mockGetAll.mockResolvedValue({ theme: 'light' });
    mockSet.mockResolvedValue(undefined);

    render(
      <ConfigProvider>
        <TestComponent />
      </ConfigProvider>,
    );

    // Wait for the provider to complete initial mounting load
    const themeDisplay = await screen.findByTestId('theme-value');
    expect(themeDisplay).toHaveTextContent('light');

    // Act: Click the update button
    const button = screen.getByRole('button', { name: /change to dark/i });
    fireEvent.click(button);

    // Assert: UI updates instantly (Optimistic UI)
    expect(themeDisplay).toHaveTextContent('dark');

    // Assert: The Electron store client was called to persist the value
    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(mockSet).toHaveBeenCalledWith('theme', 'dark');
  });

  it('keeps the optimistic value and rejects when persisting an update fails', async () => {
    const error = new Error('Write failed');
    mockGetAll.mockResolvedValue({ theme: 'light' });
    mockSet.mockRejectedValue(error);

    function UpdateWithErrorCapture() {
      const { data, update } = useConfig();
      const [message, setMessage] = useState('');

      return (
        <div>
          <div data-testid="theme-value">{data.theme}</div>
          <div data-testid="write-error">{message}</div>
          <button
            onClick={() => {
              void update('theme', 'dark').catch((writeError: Error) =>
                setMessage(writeError.message),
              );
            }}
          >
            Change to Dark
          </button>
        </div>
      );
    }

    render(
      <ConfigProvider>
        <UpdateWithErrorCapture />
      </ConfigProvider>,
    );

    expect(await screen.findByTestId('theme-value')).toHaveTextContent('light');
    fireEvent.click(screen.getByRole('button', { name: 'Change to Dark' }));

    await waitFor(() => {
      expect(screen.getByTestId('write-error')).toHaveTextContent(
        'Write failed',
      );
    });
    expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
  });

  it('throws an explicit, descriptive error when useConfig is used outside a Provider', () => {
    // Suppress console.error output block clean logs during expected crash test
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => render(<TestComponent />)).toThrow(
      'useConfig must be used within a ConfigProvider',
    );

    consoleSpy.mockRestore();
  });
});
