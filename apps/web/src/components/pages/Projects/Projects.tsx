import { useState } from 'react';
import { ProjectGrid } from '../../ProjectGrid';
import { ProjectFilters } from '../../ProjectFilters';
import { useProjects } from '../../../hooks/useProjects';
import { useProjectFilters } from '../../../hooks/useProjectFilters';
import type { ProjectsQueryParams } from '../../../types/project';

const ITEMS_PER_PAGE = 9;

export function Projects() {
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ProjectsQueryParams>({});

  // Calculate offset for pagination
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  // Fetch projects with current filters and pagination
  const { data, isLoading, isError, error } = useProjects({
    ...filters,
    limit: ITEMS_PER_PAGE,
    offset,
  });

  // Fetch unique categories and technologies for filters using dedicated endpoint
  const { data: filtersData } = useProjectFilters();

  // Extract categories and technologies from the filters endpoint
  const categories = filtersData?.categories || [];
  const technologies = filtersData?.technologies || [];

  // Calculate total pages
  const totalPages = data ? Math.ceil(data.total / ITEMS_PER_PAGE) : 1;

  // Handle filter changes
  const handleFilterChange = (newFilters: {
    featured?: boolean;
    category?: string;
    tech?: string[];
  }) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the page for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Projects
        </h1>
        <p className="mt-2 text-base text-gray-600 dark:text-gray-300 sm:text-lg">
          Explore my portfolio of web applications and open-source contributions.
        </p>
      </div>

      {/* Error State */}
      {isError && (
        <div
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-600 dark:text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
                Error loading projects
              </h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                {error instanceof Error ? error.message : 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters Sidebar - Hidden on mobile, visible on desktop */}
        <aside className="hidden lg:block" aria-label="Project filters">
          <ProjectFilters
            onFilterChange={handleFilterChange}
            categories={categories}
            technologies={technologies}
          />
        </aside>

        {/* Mobile Filters - Visible on mobile, hidden on desktop */}
        <div className="lg:hidden">
          <details className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <summary className="cursor-pointer p-4 text-lg font-semibold text-gray-900 dark:text-white">
              Filters
            </summary>
            <div className="border-t border-gray-200 p-4 dark:border-gray-700">
              <ProjectFilters
                onFilterChange={handleFilterChange}
                categories={categories}
                technologies={technologies}
              />
            </div>
          </details>
        </div>

        {/* Projects Grid */}
        <div className="lg:col-span-3">
          {!isError && (
            <ProjectGrid
              projects={data?.projects || []}
              isLoading={isLoading}
              hasMore={data?.hasMore}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              totalPages={totalPages}
            />
          )}
        </div>
      </div>
    </div>
  );
}
