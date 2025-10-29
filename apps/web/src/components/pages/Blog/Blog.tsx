export function Blog() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Blog</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Technical articles and insights about software development.
        </p>
      </div>

      <div className="space-y-6">
        <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sample Blog Post 1
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            An introduction to building modern web applications with React and TypeScript.
          </p>
          <div className="mt-4">
            <a href="/blog/sample-post-1" className="text-blue-600 hover:underline">
              Read more →
            </a>
          </div>
        </article>

        <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Sample Blog Post 2
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Best practices for API design and implementation in Node.js.
          </p>
          <div className="mt-4">
            <a href="/blog/sample-post-2" className="text-blue-600 hover:underline">
              Read more →
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}
