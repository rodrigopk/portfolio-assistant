import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { About } from '../About';

describe('About', () => {
  it('should render the main heading', () => {
    render(<About />);

    expect(screen.getByRole('heading', { name: /About Me/i })).toBeInTheDocument();
  });

  it('should render introduction paragraph', () => {
    render(<About />);

    expect(
      screen.getByText(/I'm Rodrigo Vasconcelos de Barros, a Senior Software Engineer/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/over 8 years of experience in full-stack development/i)
    ).toBeInTheDocument();
  });

  it('should render location and expertise information', () => {
    render(<About />);

    expect(screen.getByText(/Based in Toronto, Ontario, Canada/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Ruby on Rails, JavaScript, and modern web technologies/i)
    ).toBeInTheDocument();
  });

  it('should render language proficiencies', () => {
    render(<About />);

    expect(
      screen.getByText(
        /Languages: English \(professional\), Portuguese \(native\), German \(elementary\)/i
      )
    ).toBeInTheDocument();
  });

  it('should have all paragraphs rendered', () => {
    const { container } = render(<About />);

    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(3);
  });
});
