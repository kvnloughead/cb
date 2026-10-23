import '@testing-library/jest-dom';
import { render, screen, act, fireEvent } from '@testing-library/react';
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
