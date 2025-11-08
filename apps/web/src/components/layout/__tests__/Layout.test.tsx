import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from '../Layout';

// Mock the Header and Footer components
vi.mock('../Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock('../Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

// Mock ChatWidget with lazy import
vi.mock('../../widgets/ChatWidget', () => ({
  default: () => <div data-testid="chat-widget">ChatWidget</div>,
}));

// Mock Outlet from react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div data-testid="outlet">Page Content</div>,
  };
});

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Layout', () => {
  it('should render header, main content, and footer', () => {
    renderWithRouter(<Layout />);

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('should render main element for content', () => {
    renderWithRouter(<Layout />);

    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toContainElement(screen.getByTestId('outlet'));
  });

  it('should have correct structural hierarchy', () => {
    const { container } = renderWithRouter(<Layout />);

    const rootDiv = container.firstChild;
    expect(rootDiv).toHaveClass('flex', 'min-h-screen', 'flex-col');
  });

  it('should render ChatWidget lazily', async () => {
    renderWithRouter(<Layout />);

    // ChatWidget should eventually render
    const chatWidget = await screen.findByTestId('chat-widget');
    expect(chatWidget).toBeInTheDocument();
  });
});
