import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Header', () => {
  it('should render the header with site title', () => {
    renderWithRouter(<Header />);

    expect(screen.getByText('Rodrigo Vasconcelos')).toBeInTheDocument();
  });

  it('should render all navigation links', () => {
    renderWithRouter(<Header />);

    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Blog' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact' })).toBeInTheDocument();
  });

  it('should have correct href attributes for navigation links', () => {
    renderWithRouter(<Header />);

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: 'Blog' })).toHaveAttribute('href', '/blog');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/contact');
  });

  it('should render mobile menu button', () => {
    renderWithRouter(<Header />);

    const mobileMenuButton = screen.getByLabelText('Toggle menu');
    expect(mobileMenuButton).toBeInTheDocument();
    expect(mobileMenuButton.tagName).toBe('BUTTON');
  });

  it('should have navigation wrapped in header and nav elements', () => {
    renderWithRouter(<Header />);

    expect(screen.getByRole('banner')).toBeInTheDocument(); // header element
    expect(screen.getByRole('navigation')).toBeInTheDocument(); // nav element
  });
});
