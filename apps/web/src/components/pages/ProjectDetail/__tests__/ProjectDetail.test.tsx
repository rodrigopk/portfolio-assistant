import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProjectDetail } from '../ProjectDetail';

const renderWithRouter = (slug: string) => {
  return render(
    <MemoryRouter initialEntries={[`/projects/${slug}`]}>
      <Routes>
        <Route path="/projects/:slug" element={<ProjectDetail />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('ProjectDetail', () => {
  it('should render project with slug from URL', () => {
    renderWithRouter('my-project');

    expect(screen.getByRole('heading', { name: /Project: my-project/i })).toBeInTheDocument();
  });

  it('should render placeholder content', () => {
    renderWithRouter('test-project');

    expect(
      screen.getByText(/Detailed information about this project will be displayed here/)
    ).toBeInTheDocument();
  });

  it('should display different slugs correctly', () => {
    renderWithRouter('project-1');
    expect(screen.getByRole('heading', { name: /Project: project-1/i })).toBeInTheDocument();
  });
});
