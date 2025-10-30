import { useState } from 'react';

interface ProjectFiltersProps {
  onFilterChange: (filters: { featured?: boolean; category?: string; tech?: string[] }) => void;
  categories: string[];
  technologies: string[];
}

export function ProjectFilters({ onFilterChange, categories, technologies }: ProjectFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const handleCategoryChange = (category: string) => {
    const newCategory = category === selectedCategory ? '' : category;
    setSelectedCategory(newCategory);
    onFilterChange({
      category: newCategory || undefined,
      tech: selectedTech.length > 0 ? selectedTech : undefined,
      featured: featuredOnly,
    });
  };

  const handleTechToggle = (tech: string) => {
    const newTech = selectedTech.includes(tech)
      ? selectedTech.filter((t) => t !== tech)
      : [...selectedTech, tech];
    setSelectedTech(newTech);
    onFilterChange({
      category: selectedCategory || undefined,
      tech: newTech.length > 0 ? newTech : undefined,
      featured: featuredOnly,
    });
  };

  const handleFeaturedToggle = () => {
    const newFeatured = !featuredOnly;
    setFeaturedOnly(newFeatured);
    onFilterChange({
      category: selectedCategory || undefined,
      tech: selectedTech.length > 0 ? selectedTech : undefined,
      featured: newFeatured,
    });
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedTech([]);
    setFeaturedOnly(false);
    onFilterChange({});
  };

  const hasActiveFilters = selectedCategory || selectedTech.length > 0 || featuredOnly;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Featured Toggle */}
      <div className="mb-6">
        <label className="flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={featuredOnly}
            onChange={handleFeaturedToggle}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
            aria-label="Show only featured projects"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Featured only</span>
        </label>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Category</h3>
        <div className="space-y-2" role="group" aria-label="Filter by category">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
              aria-pressed={selectedCategory === category}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Technology Filter */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Technologies</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by technology">
          {technologies.map((tech) => {
            const isSelected = selectedTech.includes(tech);
            return (
              <button
                key={tech}
                onClick={() => handleTechToggle(tech)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
                aria-pressed={isSelected}
                aria-label={`Filter by ${tech}`}
              >
                {tech}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-6 border-t border-gray-200 pt-4 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400" role="status">
            Active filters:{' '}
            {[featuredOnly && 'Featured', selectedCategory, ...selectedTech.map((t) => t)]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
