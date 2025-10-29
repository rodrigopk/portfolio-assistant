export function Projects() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Explore my portfolio of web applications and open-source contributions.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Sample Project 1
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            A full-stack web application built with React and Node.js.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              React
            </span>
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm text-green-800 dark:bg-green-900 dark:text-green-300">
              Node.js
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Sample Project 2
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            An e-commerce platform with advanced features.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800 dark:bg-purple-900 dark:text-purple-300">
              Ruby on Rails
            </span>
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
              PostgreSQL
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Sample Project 3
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            A mobile-responsive web application for task management.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              TypeScript
            </span>
            <span className="rounded-full bg-pink-100 px-3 py-1 text-sm text-pink-800 dark:bg-pink-900 dark:text-pink-300">
              TailwindCSS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
