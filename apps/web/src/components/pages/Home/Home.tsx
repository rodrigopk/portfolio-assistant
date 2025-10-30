export function Home() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl dark:text-white">
          Hi, I'm Rodrigo Vasconcelos
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          Senior Software Engineer with 8+ years of experience building scalable web applications.
          Specializing in Ruby, Rails, JavaScript, and full-stack development.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/projects"
            className="rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
          >
            View Projects
          </a>
          <a
            href="/contact"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Get in Touch
          </a>
        </div>
      </div>
    </div>
  );
}
