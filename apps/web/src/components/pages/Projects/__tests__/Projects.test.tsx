import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Projects } from '../Projects';

// Mock the hooks
vi.mock('../../../../hooks/useProjects', () => ({
  useProjects: vi.fn(() => ({
    data: {
      projects: [],
      total: 0,
      page: 1,
      limit: 9,
      hasMore: false,
    },
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

vi.mock('../../../../hooks/useProjectFilters', () => ({
  useProjectFilters: vi.fn(() => ({
    data: {
      categories: [],
      technologies: [],
    },
  })),
}));

// Mock ProjectGrid and ProjectFilters components
vi.mock('../../../ProjectGrid', () => ({
  ProjectGrid: ({ projects }: { projects: unknown[] }) => (
    <div data-testid="project-grid">ProjectGrid with {projects?.length || 0} projects</div>
  ),
}));

vi.mock('../../../ProjectFilters', () => ({
  ProjectFilters: () => <div data-testid="project-filters">ProjectFilters</div>,
}));

describe('Projects', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should render the Projects page', () => {
    render(<Projects />, { wrapper });

    expect(screen.getByTestId('project-grid')).toBeInTheDocument();
    expect(screen.getAllByTestId('project-filters').length).toBeGreaterThan(0);
  });

  it('should render ProjectGrid component', () => {
    render(<Projects />, { wrapper });

    expect(screen.getByTestId('project-grid')).toHaveTextContent('ProjectGrid with 0 projects');
  });

  it('should render ProjectFilters component for both mobile and desktop', () => {
    render(<Projects />, { wrapper });

    const filters = screen.getAllByTestId('project-filters');
    // Should have both mobile and desktop versions
    expect(filters.length).toBe(2);
  });
});
