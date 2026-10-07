import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { ShortcutProvider } from '../../renderer/contexts/ShortcutContext';
import ClipHistoryPage from '../../renderer/pages/ClipHistoryPage';

const clips = [
  { id: 1, content: 'first test clip' },
  { id: 2, content: 'second test clip' },
  { id: 3, content: 'third test clip' },
];

const invoke = jest.fn();
let consoleError: jest.SpyInstance;

function renderClipboardPage() {
  return render(
    <ShortcutProvider>
      <ClipHistoryPage />
    </ShortcutProvider>,
  );
}

describe('ClipHistoryPage', () => {
  beforeEach(() => {
    consoleError = jest.spyOn(console, 'error');
    invoke.mockReset();
    invoke.mockResolvedValue(clips);

    Object.defineProperty(window, 'electron', {
      configurable: true,
      value: {
        platform: 'darwin',
        ipcRenderer: {
          invoke,
          sendMessage: jest.fn(),
          on: jest.fn(),
        },
      },
    });
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('renders the header inside ClipboardHistoryPage', async () => {
    renderClipboardPage();
    await screen.findByText('first test clip');

    const header = document.querySelector('header');
    const searchInput = header?.querySelector('input#search-input');
    expect(header).toBeInTheDocument();
    expect(searchInput).toBeInTheDocument();
  });

  it('renders ClipHistoryList inside ClipboardHistoryPage', async () => {
    renderClipboardPage();
    await screen.findByText('first test clip');

    const clipList = document.querySelector('.main ul.clip-history-list');
    expect(clipList).toBeInTheDocument();
  });

  it('loads clips from the database on startup', async () => {
    renderClipboardPage();
    expect(
      await screen.findByRole('button', { name: 'select clip 1' }),
    ).toBeInTheDocument();
    expect(invoke).toHaveBeenCalledWith('load-clip-history');
  });

  it('filters listed clips according to search query', async () => {
    renderClipboardPage();
    await screen.findByText('first test clip');

    const searchInput: HTMLInputElement = screen.getByRole('textbox', {
      name: 'Type to search',
    });
    fireEvent.change(searchInput, {
      target: { value: 'sec' },
    });

    expect(screen.getByText('second test clip')).toBeInTheDocument();
    expect(screen.queryByText('first test clip')).not.toBeInTheDocument();
    expect(screen.queryByText('third test clip')).not.toBeInTheDocument();

    fireEvent.change(searchInput, {
      target: { value: 's' },
    });

    expect(searchInput.value).toEqual('s');
    expect(screen.getByText('second test clip')).toBeInTheDocument();
    expect(screen.getByText('first test clip')).toBeInTheDocument();
    expect(screen.getByText('third test clip')).toBeInTheDocument();
  });

  it("sends 'add-to-clipboard' when a clip's button is clicked", async () => {
    renderClipboardPage();
    const clipSelectBtn = await screen.findByRole('button', {
      name: 'select clip 1',
    });
    fireEvent.click(clipSelectBtn);
    expect(window.electron.ipcRenderer.sendMessage).toHaveBeenCalledTimes(1);
    expect(window.electron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
      'add-to-clipboard',
      'first test clip',
    );
  });

  it("sends 'add-to-clipboard' when the appropriate keyboard shortcut is used", async () => {
    renderClipboardPage();
    await screen.findByText('first test clip');

    for (const [key, code, content] of [
      ['1', 'Digit1', 'first test clip'],
      ['2', 'Digit2', 'second test clip'],
    ] as const) {
      jest.clearAllMocks();
      fireEvent.keyDown(document, { key, code, metaKey: true });
      expect(window.electron.ipcRenderer.sendMessage).toHaveBeenCalledTimes(1);
      expect(window.electron.ipcRenderer.sendMessage).toHaveBeenCalledWith(
        'add-to-clipboard',
        content,
      );

      jest.clearAllMocks();
      fireEvent.keyDown(document, { key, code, ctrlKey: true });
      expect(window.electron.ipcRenderer.sendMessage).not.toHaveBeenCalled();
    }
  });

  it("displays and logs an error message if clips can't be loaded", async () => {
    consoleError.mockImplementation(() => {});

    invoke.mockRejectedValue(new Error('Database unavailable'));
    renderClipboardPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to load clipboard history',
    );

    expect(consoleError).toHaveBeenCalledWith(
      'Failed to load clipboard history:',
      new Error('Database unavailable'),
    );
  });
});
