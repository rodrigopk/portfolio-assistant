import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

describe('Footer', () => {
  const currentYear = new Date().getFullYear();

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render footer with current year', () => {
    render(<Footer />);

    expect(
      screen.getByText(new RegExp(`© ${currentYear}.*All rights reserved`))
    ).toBeInTheDocument();
  });

  it('should render copyright text with author name', () => {
    render(<Footer />);

    expect(
      screen.getByText('© 2025 Rodrigo Vasconcelos de Barros. All rights reserved.')
    ).toBeInTheDocument();
  });

  it('should render GitHub link with correct attributes', () => {
    render(<Footer />);

    const githubLink = screen.getByLabelText('GitHub');
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/rodrigopk');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should render LinkedIn link with correct attributes', () => {
    render(<Footer />);

    const linkedinLink = screen.getByLabelText('LinkedIn');
    expect(linkedinLink).toBeInTheDocument();
    expect(linkedinLink).toHaveAttribute('href', 'https://linkedin.com/in/rodrigo-vasconcelos');
    expect(linkedinLink).toHaveAttribute('target', '_blank');
    expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should have footer element with contentinfo role', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('should render social media icons', () => {
    const { container } = render(<Footer />);

    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBe(2); // GitHub and LinkedIn icons
  });

  it('should dynamically display correct year based on Date', () => {
    // Test that it uses Date.getFullYear() by verifying the current year is displayed
    render(<Footer />);

    const currentTestYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(`© ${currentTestYear}`))).toBeInTheDocument();
  });
});
