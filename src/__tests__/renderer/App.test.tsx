import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from '../../renderer/App';

const invoke = jest.fn();

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
  });

  it('renders the app and its main heading', async () => {
    invoke.mockResolvedValue([{ id: 1, content: 'app test clip' }]);
    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'cb' }),
    ).toHaveTextContent('Clipboard History');
    expect(await screen.findByText('app test clip')).toBeInTheDocument();
  });

  it('initially focuses on the search input', async () => {
    render(<App />);
    expect(await screen.findByRole('searchbox')).toHaveFocus();
  });
});
