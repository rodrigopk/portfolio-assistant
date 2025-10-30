import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectGrid } from '../ProjectGrid';
import type { ProjectSummary } from '../../types/project';

// Mock ProjectCard component
vi.mock('../ProjectCard', () => ({
  ProjectCard: ({ project }: { project: ProjectSummary }) => (
    <div data-testid={`project-card-${project.id}`}>{project.title}</div>
  ),
}));

const mockProjects: ProjectSummary[] = [
  {
    id: '1',
    title: 'Project 1',
    slug: 'project-1',
    description: 'Description 1',
    technologies: ['React', 'TypeScript'],
    featured: true,
    category: 'web',
    githubUrl: 'https://github.com/test/project1',
    liveUrl: 'https://project1.com',
    imageUrl: 'https://example.com/image1.jpg',
    githubStars: 100,
    githubForks: 20,
  },
  {
    id: '2',
    title: 'Project 2',
    slug: 'project-2',
    description: 'Description 2',
    technologies: ['Vue', 'JavaScript'],
    featured: false,
    category: 'web',
    githubUrl: 'https://github.com/test/project2',
    liveUrl: null,
    imageUrl: null,
    githubStars: 50,
    githubForks: 10,
  },
];

describe('ProjectGrid', () => {
  const defaultProps = {
    projects: mockProjects,
    isLoading: false,
    hasMore: false,
    currentPage: 1,
    onPageChange: vi.fn(),
    totalPages: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading skeleton when isLoading is true', () => {
      render(<ProjectGrid {...defaultProps} isLoading={true} projects={[]} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading projects...')).toBeInTheDocument();

      // Check for skeleton cards
      const skeletonCards = screen.getAllByLabelText('Loading project');
      expect(skeletonCards).toHaveLength(6);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no projects are provided', () => {
      render(<ProjectGrid {...defaultProps} projects={[]} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('No projects found')).toBeInTheDocument();
      expect(
        screen.getByText('Try adjusting your filters to see more results.')
      ).toBeInTheDocument();
    });
  });

  describe('Projects Display', () => {
    it('should render project cards when projects are provided', () => {
      render(<ProjectGrid {...defaultProps} />);

      expect(screen.getByRole('list', { name: 'Projects list' })).toBeInTheDocument();
      expect(screen.getByTestId('project-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('project-card-2')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    const mockOnPageChange = vi.fn();

    beforeEach(() => {
      mockOnPageChange.mockClear();
    });

    it('should not show pagination when totalPages is 1', () => {
      render(<ProjectGrid {...defaultProps} totalPages={1} onPageChange={mockOnPageChange} />);

      expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
    });

    it('should show pagination when totalPages > 1', () => {
      render(<ProjectGrid {...defaultProps} totalPages={5} onPageChange={mockOnPageChange} />);

      expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    });

    describe('Mobile Pagination', () => {
      it('should show mobile pagination buttons', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={5}
            currentPage={2}
            hasMore={true}
            onPageChange={mockOnPageChange}
          />
        );

        // Get mobile buttons by finding them within the mobile container
        const mobileContainer = document.querySelector('.sm\\:hidden');
        const prevButton = mobileContainer?.querySelector(
          'button[aria-label="Previous page"]'
        ) as HTMLElement;
        const nextButton = mobileContainer?.querySelector(
          'button[aria-label="Next page"]'
        ) as HTMLElement;

        expect(prevButton).toBeInTheDocument();
        expect(nextButton).toBeInTheDocument();
      });

      it('should disable previous button on first page', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={5}
            currentPage={1}
            onPageChange={mockOnPageChange}
          />
        );

        const mobileContainer = document.querySelector('.sm\\:hidden');
        const prevButton = mobileContainer?.querySelector(
          'button[aria-label="Previous page"]'
        ) as HTMLElement;
        expect(prevButton).toBeDisabled();
      });

      it('should disable next button when no more pages', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={5}
            currentPage={5}
            hasMore={false}
            onPageChange={mockOnPageChange}
          />
        );

        const mobileContainer = document.querySelector('.sm\\:hidden');
        const nextButton = mobileContainer?.querySelector(
          'button[aria-label="Next page"]'
        ) as HTMLElement;
        expect(nextButton).toBeDisabled();
      });

      it('should call onPageChange when mobile buttons are clicked', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={5}
            currentPage={2}
            hasMore={true}
            onPageChange={mockOnPageChange}
          />
        );

        const mobileContainer = document.querySelector('.sm\\:hidden');
        const prevButton = mobileContainer?.querySelector(
          'button[aria-label="Previous page"]'
        ) as HTMLElement;
        const nextButton = mobileContainer?.querySelector(
          'button[aria-label="Next page"]'
        ) as HTMLElement;

        fireEvent.click(prevButton);
        expect(mockOnPageChange).toHaveBeenCalledWith(1);

        fireEvent.click(nextButton);
        expect(mockOnPageChange).toHaveBeenCalledWith(3);
      });
    });

    describe('Desktop Pagination', () => {
      it('should show page info', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={5}
            currentPage={2}
            onPageChange={mockOnPageChange}
          />
        );

        const pageInfo = screen.getAllByText((_, element) => {
          return element?.textContent === 'Page 2 of 5' && element?.tagName.toLowerCase() === 'p';
        })[0];
        expect(pageInfo).toBeInTheDocument();
      });

      it('should show correct pagination for few pages (no ellipsis needed)', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={5}
            currentPage={3}
            onPageChange={mockOnPageChange}
          />
        );

        // Should show: 1 2 [3] 4 5
        expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();

        // Should not show ellipsis
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      it('should show left ellipsis when current page > 4', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={10}
            currentPage={6}
            onPageChange={mockOnPageChange}
          />
        );

        // Should show: 1 ... 5 [6] 7 ... 10
        expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 6' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 7' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument();

        // Should show both ellipsis
        const ellipsisElements = screen.getAllByText('...');
        expect(ellipsisElements).toHaveLength(2);
      });

      it('should show right ellipsis when current page < totalPages - 3', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={10}
            currentPage={3}
            onPageChange={mockOnPageChange}
          />
        );

        // Should show: 1 2 [3] 4 ... 10
        expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 10' })).toBeInTheDocument();

        // Should show only right ellipsis
        const ellipsisElements = screen.getAllByText('...');
        expect(ellipsisElements).toHaveLength(1);
      });

      it('should not show ellipsis when adjacent to visible range', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={6}
            currentPage={4}
            onPageChange={mockOnPageChange}
          />
        );

        // Should show: 1 2 3 [4] 5 6 (no ellipsis because page 2 and 5 are adjacent to the range)
        expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 3' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 4' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 5' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 6' })).toBeInTheDocument();

        // Should not show ellipsis
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      it('should highlight current page', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={5}
            currentPage={3}
            onPageChange={mockOnPageChange}
          />
        );

        const currentPageButton = screen.getByRole('button', { name: 'Page 3' });
        expect(currentPageButton).toHaveAttribute('aria-current', 'page');
        expect(currentPageButton).toHaveClass('border-blue-500', 'bg-blue-50', 'text-blue-600');
      });

      it('should call onPageChange when page numbers are clicked', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={5}
            currentPage={2}
            onPageChange={mockOnPageChange}
          />
        );

        const page3Button = screen.getByRole('button', { name: 'Page 3' });
        fireEvent.click(page3Button);

        expect(mockOnPageChange).toHaveBeenCalledWith(3);
      });

      it('should handle navigation buttons correctly', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={5}
            currentPage={2}
            hasMore={true}
            onPageChange={mockOnPageChange}
          />
        );

        // Get desktop buttons by finding them within the desktop container
        const desktopContainer = document.querySelector('.hidden.sm\\:flex');
        const prevButton = desktopContainer?.querySelector(
          'button[aria-label="Previous page"]'
        ) as HTMLElement;
        const nextButton = desktopContainer?.querySelector(
          'button[aria-label="Next page"]'
        ) as HTMLElement;

        fireEvent.click(prevButton);
        expect(mockOnPageChange).toHaveBeenCalledWith(1);

        fireEvent.click(nextButton);
        expect(mockOnPageChange).toHaveBeenCalledWith(3);
      });

      it('should disable previous button on first page', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={5}
            currentPage={1}
            onPageChange={mockOnPageChange}
          />
        );

        const desktopContainer = document.querySelector('.hidden.sm\\:flex');
        const prevButton = desktopContainer?.querySelector(
          'button[aria-label="Previous page"]'
        ) as HTMLElement;
        expect(prevButton).toBeDisabled();
      });

      it('should disable next button on last page', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={5}
            currentPage={5}
            hasMore={false}
            onPageChange={mockOnPageChange}
          />
        );

        const desktopContainer = document.querySelector('.hidden.sm\\:flex');
        const nextButton = desktopContainer?.querySelector(
          'button[aria-label="Next page"]'
        ) as HTMLElement;
        expect(nextButton).toBeDisabled();
      });
    });

    describe('Edge Cases', () => {
      it('should handle single page correctly', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={1}
            currentPage={1}
            onPageChange={mockOnPageChange}
          />
        );

        expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument();
      });

      it('should handle two pages correctly', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={2}
            currentPage={1}
            onPageChange={mockOnPageChange}
          />
        );

        expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 2' })).toBeInTheDocument();
        expect(screen.queryByText('...')).not.toBeInTheDocument();
      });

      it('should handle large number of pages correctly', () => {
        render(
          <ProjectGrid
            {...defaultProps}
            totalPages={100}
            currentPage={50}
            onPageChange={mockOnPageChange}
          />
        );

        // Should show: 1 ... 49 [50] 51 ... 100
        expect(screen.getByRole('button', { name: 'Page 1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 49' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 50' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 51' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Page 100' })).toBeInTheDocument();

        // Should show both ellipsis
        const ellipsisElements = screen.getAllByText('...');
        expect(ellipsisElements).toHaveLength(2);
      });
    });
  });
});
