import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white">404</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">Page not found</p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
