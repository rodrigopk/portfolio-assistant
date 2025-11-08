import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Blog } from '../Blog';

describe('Blog', () => {
  it('should render the main heading', () => {
    render(<Blog />);

    expect(screen.getByRole('heading', { name: /Blog/i, level: 1 })).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    render(<Blog />);

    expect(
      screen.getByText(/Technical articles and insights about software development/i)
    ).toBeInTheDocument();
  });

  it('should render blog post titles', () => {
    render(<Blog />);

    expect(screen.getByRole('heading', { name: /Sample Blog Post 1/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Sample Blog Post 2/i })).toBeInTheDocument();
  });

  it('should render blog post excerpts', () => {
    render(<Blog />);

    expect(
      screen.getByText(/An introduction to building modern web applications/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Best practices for API design and implementation/)
    ).toBeInTheDocument();
  });

  it('should render read more links', () => {
    render(<Blog />);

    const readMoreLinks = screen.getAllByText(/Read more →/);
    expect(readMoreLinks).toHaveLength(2);
    expect(readMoreLinks[0]).toHaveAttribute('href', '/blog/sample-post-1');
    expect(readMoreLinks[1]).toHaveAttribute('href', '/blog/sample-post-2');
  });

  it('should render blog posts as articles', () => {
    const { container } = render(<Blog />);

    const articles = container.querySelectorAll('article');
    expect(articles).toHaveLength(2);
  });
});
