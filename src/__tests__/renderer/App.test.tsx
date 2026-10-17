import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from '../../renderer/App';
import { ConfigProvider } from '../../renderer/contexts/ConfigContext';
import { ShortcutProvider } from '../../renderer/contexts/ShortcutContext';

const invoke = jest.fn();

function renderApp() {
  render(
    <ShortcutProvider>
      <ConfigProvider>
        <App />
      </ConfigProvider>
    </ShortcutProvider>,
  );
}

describe('App', () => {
  beforeEach(() => {
    invoke.mockResolvedValue([]);
    Object.defineProperty(window, 'electron', {
      configurable: true,
      value: {
        configStore: {
          getAll: jest.fn().mockResolvedValue(undefined),
          set: jest.fn(),
        },
        ipcRenderer: {
          invoke,
          sendMessage: jest.fn(),
          on: jest.fn(),
        },
      },
    });

    const mockMatchMedia = jest.fn().mockReturnValue({
      matches: [],
      addEventListener: () => {},
      removeEventListener: () => {},
    });

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: mockMatchMedia,
    });
  });

  it('renders the app and its main heading', async () => {
    invoke.mockResolvedValue([{ id: 1, content: 'app test clip' }]);
    renderApp();

    expect(
      await screen.findByRole('heading', { name: 'cb' }),
    ).toHaveTextContent('Clipboard History');
    expect(await screen.findByText('app test clip')).toBeInTheDocument();
  });

  it('initially focuses on the search input', async () => {
    renderApp();
    expect(await screen.findByRole('searchbox')).toHaveFocus();
  });
});
