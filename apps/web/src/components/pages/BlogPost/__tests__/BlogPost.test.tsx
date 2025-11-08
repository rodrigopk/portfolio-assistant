import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { BlogPost } from '../BlogPost';

const renderWithRouter = (slug: string) => {
  return render(
    <MemoryRouter initialEntries={[`/blog/${slug}`]}>
      <Routes>
        <Route path="/blog/:slug" element={<BlogPost />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('BlogPost', () => {
  it('should render blog post with slug from URL', () => {
    renderWithRouter('my-awesome-post');

    expect(
      screen.getByRole('heading', { name: /Blog Post: my-awesome-post/i })
    ).toBeInTheDocument();
  });

  it('should render placeholder content', () => {
    renderWithRouter('sample-post');

    expect(
      screen.getByText(/The full content of this blog post will be displayed here/)
    ).toBeInTheDocument();
  });

  it('should render article element', () => {
    const { container } = renderWithRouter('test-post');

    const article = container.querySelector('article');
    expect(article).toBeInTheDocument();
  });

  it('should display different slugs correctly', () => {
    renderWithRouter('post-1');
    expect(screen.getByRole('heading', { name: /Blog Post: post-1/i })).toBeInTheDocument();
  });
});
