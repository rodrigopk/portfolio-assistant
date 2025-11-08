import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Home } from '../Home';

describe('Home', () => {
  it('should render the main heading', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { name: /Hi, I'm Rodrigo Vasconcelos/i })
    ).toBeInTheDocument();
  });

  it('should render the introduction text', () => {
    render(<Home />);

    expect(
      screen.getByText(/Senior Software Engineer with 8\+ years of experience/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ruby, Rails, JavaScript, and full-stack development/i)
    ).toBeInTheDocument();
  });

  it('should render View Projects link', () => {
    render(<Home />);

    const projectsLink = screen.getByRole('link', { name: /View Projects/i });
    expect(projectsLink).toBeInTheDocument();
    expect(projectsLink).toHaveAttribute('href', '/projects');
  });

  it('should render Get in Touch link', () => {
    render(<Home />);

    const contactLink = screen.getByRole('link', { name: /Get in Touch/i });
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute('href', '/contact');
  });

  it('should have proper structure and layout', () => {
    const { container } = render(<Home />);

    expect(container.querySelector('.text-center')).toBeInTheDocument();
  });
});
