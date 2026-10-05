import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from '../../renderer/App';

describe('App', () => {
  it('renders the app and its main heading', async () => {
    Object.defineProperty(window, 'electron', {
      configurable: true,
      value: {
        ipcRenderer: {
          invoke: jest
            .fn()
            .mockResolvedValue([{ id: 1, content: 'app test clip' }]),
          sendMessage: jest.fn(),
        },
      },
    });

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'cb' }),
    ).toHaveTextContent('Clipboard History');
    expect(await screen.findByText('app test clip')).toBeInTheDocument();
  });
});
