import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectFilters } from '../ProjectFilters';

describe('ProjectFilters', () => {
  const mockOnFilterChange = vi.fn();
  const mockCategories = ['web', 'mobile', 'desktop'];
  const mockTechnologies = ['React', 'TypeScript', 'Node.js', 'Python', 'Vue'];

  const defaultProps = {
    onFilterChange: mockOnFilterChange,
    categories: mockCategories,
    technologies: mockTechnologies,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render all filter sections', () => {
      render(<ProjectFilters {...defaultProps} />);

      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByLabelText('Show only featured projects')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Technologies')).toBeInTheDocument();
    });

    it('should render all categories as buttons', () => {
      render(<ProjectFilters {...defaultProps} />);

      mockCategories.forEach((category) => {
        expect(screen.getByRole('button', { name: category })).toBeInTheDocument();
      });
    });

    it('should render all technologies as buttons', () => {
      render(<ProjectFilters {...defaultProps} />);

      mockTechnologies.forEach((tech) => {
        expect(screen.getByRole('button', { name: `Filter by ${tech}` })).toBeInTheDocument();
      });
    });

    it('should not show clear all button initially', () => {
      render(<ProjectFilters {...defaultProps} />);

      expect(screen.queryByRole('button', { name: 'Clear all filters' })).not.toBeInTheDocument();
    });

    it('should not show active filters summary initially', () => {
      render(<ProjectFilters {...defaultProps} />);

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Featured Filter', () => {
    it('should toggle featured filter and call onFilterChange with boolean values', () => {
      render(<ProjectFilters {...defaultProps} />);

      const featuredCheckbox = screen.getByLabelText('Show only featured projects');

      // Initially unchecked
      expect(featuredCheckbox).not.toBeChecked();

      // Click to enable featured filter - should call with featured: true
      fireEvent.click(featuredCheckbox);
      expect(featuredCheckbox).toBeChecked();
      expect(mockOnFilterChange).toHaveBeenCalledWith({ featured: true });

      // Click again to disable featured filter - should call with featured: false
      fireEvent.click(featuredCheckbox);
      expect(featuredCheckbox).not.toBeChecked();
      expect(mockOnFilterChange).toHaveBeenCalledWith({ featured: false });
    });
  });

  describe('Category Filter', () => {
    it('should select and deselect categories', () => {
      render(<ProjectFilters {...defaultProps} />);

      const webButton = screen.getByRole('button', { name: 'web' });

      // Click to select category
      fireEvent.click(webButton);
      expect(webButton).toHaveAttribute('aria-pressed', 'true');
      expect(mockOnFilterChange).toHaveBeenCalledWith({ category: 'web', featured: false });

      // Click again to deselect category
      fireEvent.click(webButton);
      expect(webButton).toHaveAttribute('aria-pressed', 'false');
      expect(mockOnFilterChange).toHaveBeenCalledWith({ featured: false });
    });

    it('should only allow one category selection at a time', () => {
      render(<ProjectFilters {...defaultProps} />);

      const webButton = screen.getByRole('button', { name: 'web' });
      const mobileButton = screen.getByRole('button', { name: 'mobile' });

      // Select web category
      fireEvent.click(webButton);
      expect(webButton).toHaveAttribute('aria-pressed', 'true');
      expect(mobileButton).toHaveAttribute('aria-pressed', 'false');

      // Select mobile category (should deselect web)
      fireEvent.click(mobileButton);
      expect(webButton).toHaveAttribute('aria-pressed', 'false');
      expect(mobileButton).toHaveAttribute('aria-pressed', 'true');
      expect(mockOnFilterChange).toHaveBeenCalledWith({ category: 'mobile', featured: false });
    });
  });

  describe('Technology Filter', () => {
    it('should allow multiple technology selections', () => {
      render(<ProjectFilters {...defaultProps} />);

      const reactButton = screen.getByRole('button', { name: 'Filter by React' });
      const typescriptButton = screen.getByRole('button', { name: 'Filter by TypeScript' });

      // Select React
      fireEvent.click(reactButton);
      expect(reactButton).toHaveAttribute('aria-pressed', 'true');
      expect(mockOnFilterChange).toHaveBeenCalledWith({ tech: ['React'], featured: false });

      // Select TypeScript (should keep React selected)
      fireEvent.click(typescriptButton);
      expect(reactButton).toHaveAttribute('aria-pressed', 'true');
      expect(typescriptButton).toHaveAttribute('aria-pressed', 'true');
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        tech: ['React', 'TypeScript'],
        featured: false,
      });
    });

    it('should deselect technologies when clicked again', () => {
      render(<ProjectFilters {...defaultProps} />);

      const reactButton = screen.getByRole('button', { name: 'Filter by React' });

      // Select React
      fireEvent.click(reactButton);
      expect(reactButton).toHaveAttribute('aria-pressed', 'true');

      // Deselect React
      fireEvent.click(reactButton);
      expect(reactButton).toHaveAttribute('aria-pressed', 'false');
      expect(mockOnFilterChange).toHaveBeenCalledWith({ featured: false });
    });
  });

  describe('Combined Filters', () => {
    it('should handle multiple filter types simultaneously', () => {
      render(<ProjectFilters {...defaultProps} />);

      const featuredCheckbox = screen.getByLabelText('Show only featured projects');
      const webButton = screen.getByRole('button', { name: 'web' });
      const reactButton = screen.getByRole('button', { name: 'Filter by React' });

      // Enable featured filter
      fireEvent.click(featuredCheckbox);
      expect(mockOnFilterChange).toHaveBeenCalledWith({ featured: true });

      // Select web category
      fireEvent.click(webButton);
      expect(mockOnFilterChange).toHaveBeenCalledWith({ category: 'web', featured: true });

      // Select React technology
      fireEvent.click(reactButton);
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        category: 'web',
        tech: ['React'],
        featured: true,
      });
    });
  });

  describe('Clear All Filters', () => {
    it('should show clear all button when filters are active', () => {
      render(<ProjectFilters {...defaultProps} />);

      // Initially no clear button
      expect(screen.queryByRole('button', { name: 'Clear all filters' })).not.toBeInTheDocument();

      // Enable featured filter
      const featuredCheckbox = screen.getByLabelText('Show only featured projects');
      fireEvent.click(featuredCheckbox);

      // Clear button should appear
      expect(screen.getByRole('button', { name: 'Clear all filters' })).toBeInTheDocument();
    });

    it('should clear all filters when clicked', () => {
      render(<ProjectFilters {...defaultProps} />);

      const featuredCheckbox = screen.getByLabelText('Show only featured projects');
      const webButton = screen.getByRole('button', { name: 'web' });
      const reactButton = screen.getByRole('button', { name: 'Filter by React' });

      // Set multiple filters
      fireEvent.click(featuredCheckbox);
      fireEvent.click(webButton);
      fireEvent.click(reactButton);

      // Clear all filters
      const clearButton = screen.getByRole('button', { name: 'Clear all filters' });
      fireEvent.click(clearButton);

      // All filters should be reset
      expect(featuredCheckbox).not.toBeChecked();
      expect(webButton).toHaveAttribute('aria-pressed', 'false');
      expect(reactButton).toHaveAttribute('aria-pressed', 'false');
      expect(mockOnFilterChange).toHaveBeenCalledWith({});

      // Clear button should disappear
      expect(screen.queryByRole('button', { name: 'Clear all filters' })).not.toBeInTheDocument();
    });
  });

  describe('Active Filters Summary', () => {
    it('should show active filters summary when filters are applied', () => {
      render(<ProjectFilters {...defaultProps} />);

      const featuredCheckbox = screen.getByLabelText('Show only featured projects');
      const webButton = screen.getByRole('button', { name: 'web' });
      const reactButton = screen.getByRole('button', { name: 'Filter by React' });

      // Apply filters
      fireEvent.click(featuredCheckbox);
      fireEvent.click(webButton);
      fireEvent.click(reactButton);

      // Check active filters summary
      const summary = screen.getByRole('status');
      expect(summary).toHaveTextContent('Active filters: Featured, web, React');
    });

    it('should update summary when filters change', () => {
      render(<ProjectFilters {...defaultProps} />);

      const featuredCheckbox = screen.getByLabelText('Show only featured projects');
      const webButton = screen.getByRole('button', { name: 'web' });

      // Apply featured filter
      fireEvent.click(featuredCheckbox);
      expect(screen.getByRole('status')).toHaveTextContent('Active filters: Featured');

      // Add category filter
      fireEvent.click(webButton);
      expect(screen.getByRole('status')).toHaveTextContent('Active filters: Featured, web');

      // Remove featured filter
      fireEvent.click(featuredCheckbox);
      expect(screen.getByRole('status')).toHaveTextContent('Active filters: web');
    });

    it('should hide summary when no filters are active', () => {
      render(<ProjectFilters {...defaultProps} />);

      const featuredCheckbox = screen.getByLabelText('Show only featured projects');

      // Apply filter
      fireEvent.click(featuredCheckbox);
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Remove filter
      fireEvent.click(featuredCheckbox);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Filter Change Behavior', () => {
    it('should always include featured parameter in filter calls', () => {
      render(<ProjectFilters {...defaultProps} />);

      const webButton = screen.getByRole('button', { name: 'web' });
      const reactButton = screen.getByRole('button', { name: 'Filter by React' });

      // Test category change includes featured: false
      fireEvent.click(webButton);
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        category: 'web',
        featured: false,
      });

      // Test technology change includes featured: false
      fireEvent.click(reactButton);
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        category: 'web',
        tech: ['React'],
        featured: false,
      });
    });

    it('should preserve featured state across other filter changes', () => {
      render(<ProjectFilters {...defaultProps} />);

      const featuredCheckbox = screen.getByLabelText('Show only featured projects');
      const webButton = screen.getByRole('button', { name: 'web' });

      // Enable featured
      fireEvent.click(featuredCheckbox);
      expect(mockOnFilterChange).toHaveBeenCalledWith({ featured: true });

      // Change category - should preserve featured: true
      fireEvent.click(webButton);
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        category: 'web',
        featured: true,
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<ProjectFilters {...defaultProps} />);

      // Check group roles
      expect(screen.getByRole('group', { name: 'Filter by category' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Filter by technology' })).toBeInTheDocument();

      // Check aria-pressed attributes
      const categoryButtons = screen
        .getAllByRole('button')
        .filter((btn) => mockCategories.includes(btn.textContent || ''));
      categoryButtons.forEach((button) => {
        expect(button).toHaveAttribute('aria-pressed');
      });

      // Check technology button labels
      mockTechnologies.forEach((tech) => {
        const button = screen.getByRole('button', { name: `Filter by ${tech}` });
        expect(button).toHaveAttribute('aria-pressed');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty categories array', () => {
      render(<ProjectFilters {...defaultProps} categories={[]} />);

      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Filter by category' })).toBeInTheDocument();
    });

    it('should handle empty technologies array', () => {
      render(<ProjectFilters {...defaultProps} technologies={[]} />);

      expect(screen.getByText('Technologies')).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Filter by technology' })).toBeInTheDocument();
    });
  });
});
