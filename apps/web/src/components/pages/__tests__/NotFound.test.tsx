import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotFound } from '../NotFound';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('NotFound', () => {
  it('should render 404 heading', () => {
    renderWithRouter(<NotFound />);

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
  });

  it('should render "Page not found" message', () => {
    renderWithRouter(<NotFound />);

    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('should render link to go back home', () => {
    renderWithRouter(<NotFound />);

    const homeLink = screen.getByRole('link', { name: /Go back home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should have centered layout', () => {
    const { container } = renderWithRouter(<NotFound />);

    const centerDiv = container.querySelector('.text-center');
    expect(centerDiv).toBeInTheDocument();
  });
});
