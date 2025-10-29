import { useParams } from 'react-router-dom';

export function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project: {slug}</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        Detailed information about this project will be displayed here.
      </p>
    </div>
  );
}
