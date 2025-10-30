import { Link } from 'react-router-dom';
import type { ProjectSummary } from '../types/project';

interface ProjectCardProps {
  project: ProjectSummary;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const {
    title,
    slug,
    description,
    technologies,
    featured,
    githubUrl,
    liveUrl,
    imageUrl,
    githubStars,
    githubForks,
  } = project;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
      aria-label={`Project: ${title}`}
    >
      {/* Featured Badge */}
      {featured && (
        <div
          className="absolute top-4 right-4 z-10 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
          aria-label="Featured project"
        >
          Featured
        </div>
      )}

      {/* Project Image */}
      {imageUrl ? (
        <Link to={`/projects/${slug}`} className="block overflow-hidden">
          <img
            src={imageUrl}
            alt={`${title} preview`}
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
      ) : (
        <Link
          to={`/projects/${slug}`}
          className="flex h-48 items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600"
        >
          <span className="text-4xl font-bold text-white opacity-50">{title.charAt(0)}</span>
        </Link>
      )}

      {/* Card Content */}
      <div className="flex flex-1 flex-col p-6">
        {/* Title */}
        <h3 className="mb-2">
          <Link
            to={`/projects/${slug}`}
            className="text-xl font-semibold text-gray-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
          >
            {title}
          </Link>
        </h3>

        {/* Description */}
        <p className="mb-4 flex-1 text-sm text-gray-600 dark:text-gray-300">{description}</p>

        {/* Technologies */}
        <div className="mb-4 flex flex-wrap gap-2" role="list" aria-label="Technologies used">
          {technologies.slice(0, 4).map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              role="listitem"
            >
              {tech}
            </span>
          ))}
          {technologies.length > 4 && (
            <span
              className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              role="listitem"
            >
              +{technologies.length - 4} more
            </span>
          )}
        </div>

        {/* Footer with Stats and Links */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-700">
          {/* GitHub Stats */}
          {(githubStars !== null || githubForks !== null) && (
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              {githubStars !== null && (
                <span className="flex items-center gap-1" aria-label={`${githubStars} stars`}>
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {githubStars}
                </span>
              )}
              {githubForks !== null && (
                <span className="flex items-center gap-1" aria-label={`${githubForks} forks`}>
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {githubForks}
                </span>
              )}
            </div>
          )}

          {/* Action Links */}
          <div className="flex items-center gap-2">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                aria-label={`View ${title} on GitHub`}
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            )}
            {liveUrl && (
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                aria-label={`View ${title} live demo`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
