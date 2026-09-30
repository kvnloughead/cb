import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import App from '../renderer/App';

describe('App', () => {
  it('renders the home route and project links', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'cb' })).toBeInTheDocument();
  });
});
