import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProjectCard } from '../ProjectCard';
import type { ProjectSummary } from '../../types/project';

// Helper to render with router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

const baseProject: ProjectSummary = {
  id: '1',
  title: 'Test Project',
  slug: 'test-project',
  description: 'A test project description',
  technologies: ['React', 'TypeScript', 'Vite'],
  featured: false,
  category: 'web',
  githubUrl: 'https://github.com/test/project',
  liveUrl: 'https://example.com',
  imageUrl: 'https://example.com/image.jpg',
  githubStars: 100,
  githubForks: 20,
};

describe('ProjectCard', () => {
  describe('Basic Rendering', () => {
    it('should render the project card with all basic information', () => {
      renderWithRouter(<ProjectCard project={baseProject} />);

      expect(
        screen.getByRole('article', { name: `Project: ${baseProject.title}` })
      ).toBeInTheDocument();
      expect(screen.getByText(baseProject.title)).toBeInTheDocument();
      expect(screen.getByText(baseProject.description)).toBeInTheDocument();
    });

    it('should render project image when imageUrl is provided', () => {
      renderWithRouter(<ProjectCard project={baseProject} />);

      const image = screen.getByRole('img', { name: `${baseProject.title} preview` });
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', baseProject.imageUrl);
      expect(image).toHaveAttribute('loading', 'lazy');
    });

    it('should render placeholder when imageUrl is not provided', () => {
      const projectWithoutImage = { ...baseProject, imageUrl: null };
      renderWithRouter(<ProjectCard project={projectWithoutImage} />);

      // Should show first letter of title
      expect(screen.getByText('T')).toBeInTheDocument();
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Featured Badge', () => {
    it('should display featured badge when project is featured', () => {
      const featuredProject = { ...baseProject, featured: true };
      renderWithRouter(<ProjectCard project={featuredProject} />);

      expect(screen.getByLabelText('Featured project')).toBeInTheDocument();
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('should not display featured badge when project is not featured', () => {
      renderWithRouter(<ProjectCard project={baseProject} />);

      expect(screen.queryByLabelText('Featured project')).not.toBeInTheDocument();
      expect(screen.queryByText('Featured')).not.toBeInTheDocument();
    });
  });

  describe('Technologies', () => {
    it('should display all technologies when there are 4 or fewer', () => {
      renderWithRouter(<ProjectCard project={baseProject} />);

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Vite')).toBeInTheDocument();
    });

    it('should display only first 4 technologies and show "+N more" when there are more than 4', () => {
      const projectWithManyTechs = {
        ...baseProject,
        technologies: ['React', 'TypeScript', 'Vite', 'TailwindCSS', 'Node.js', 'Express'],
      };
      renderWithRouter(<ProjectCard project={projectWithManyTechs} />);

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('TypeScript')).toBeInTheDocument();
      expect(screen.getByText('Vite')).toBeInTheDocument();
      expect(screen.getByText('TailwindCSS')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
      expect(screen.queryByText('Node.js')).not.toBeInTheDocument();
      expect(screen.queryByText('Express')).not.toBeInTheDocument();
    });
  });

  describe('GitHub Stats', () => {
    it('should display GitHub stars when provided', () => {
      renderWithRouter(<ProjectCard project={baseProject} />);

      const starsLabel = screen.getByLabelText(`${baseProject.githubStars} stars`);
      expect(starsLabel).toBeInTheDocument();
      expect(starsLabel).toHaveTextContent('100');
    });

    it('should display GitHub forks when provided', () => {
      renderWithRouter(<ProjectCard project={baseProject} />);

      const forksLabel = screen.getByLabelText(`${baseProject.githubForks} forks`);
      expect(forksLabel).toBeInTheDocument();
      expect(forksLabel).toHaveTextContent('20');
    });

    it('should not display stars when null', () => {
      const projectWithoutStars = { ...baseProject, githubStars: null };
      renderWithRouter(<ProjectCard project={projectWithoutStars} />);

      expect(screen.queryByLabelText(/stars/)).not.toBeInTheDocument();
    });

    it('should not display forks when null', () => {
      const projectWithoutForks = { ...baseProject, githubForks: null };
      renderWithRouter(<ProjectCard project={projectWithoutForks} />);

      expect(screen.queryByLabelText(/forks/)).not.toBeInTheDocument();
    });

    it('should not display stats section when both stars and forks are null', () => {
      const projectWithoutStats = { ...baseProject, githubStars: null, githubForks: null };
      renderWithRouter(<ProjectCard project={projectWithoutStats} />);

      expect(screen.queryByLabelText(/stars/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/forks/)).not.toBeInTheDocument();
    });
  });

  describe('Action Links', () => {
    it('should display GitHub link when githubUrl is provided', () => {
      renderWithRouter(<ProjectCard project={baseProject} />);

      const githubLink = screen.getByLabelText(`View ${baseProject.title} on GitHub`);
      expect(githubLink).toBeInTheDocument();
      expect(githubLink).toHaveAttribute('href', baseProject.githubUrl);
      expect(githubLink).toHaveAttribute('target', '_blank');
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should display live demo link when liveUrl is provided', () => {
      renderWithRouter(<ProjectCard project={baseProject} />);

      const liveLink = screen.getByLabelText(`View ${baseProject.title} live demo`);
      expect(liveLink).toBeInTheDocument();
      expect(liveLink).toHaveAttribute('href', baseProject.liveUrl);
      expect(liveLink).toHaveAttribute('target', '_blank');
      expect(liveLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should not display GitHub link when githubUrl is null', () => {
      const projectWithoutGithub = { ...baseProject, githubUrl: null };
      renderWithRouter(<ProjectCard project={projectWithoutGithub} />);

      expect(
        screen.queryByLabelText(`View ${baseProject.title} on GitHub`)
      ).not.toBeInTheDocument();
    });

    it('should not display live demo link when liveUrl is null', () => {
      const projectWithoutLive = { ...baseProject, liveUrl: null };
      renderWithRouter(<ProjectCard project={projectWithoutLive} />);

      expect(
        screen.queryByLabelText(`View ${baseProject.title} live demo`)
      ).not.toBeInTheDocument();
    });
  });

  describe('Navigation Links', () => {
    it('should have correct links to project detail page', () => {
      renderWithRouter(<ProjectCard project={baseProject} />);

      const titleLink = screen.getByRole('link', { name: baseProject.title });
      expect(titleLink).toHaveAttribute('href', `/projects/${baseProject.slug}`);
    });

    it('should have image linking to project detail page', () => {
      renderWithRouter(<ProjectCard project={baseProject} />);

      const links = screen.getAllByRole('link');
      const imageLink = links.find((link) =>
        link.querySelector(`img[alt="${baseProject.title} preview"]`)
      );
      expect(imageLink).toHaveAttribute('href', `/projects/${baseProject.slug}`);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithRouter(<ProjectCard project={baseProject} />);

      expect(
        screen.getByRole('article', { name: `Project: ${baseProject.title}` })
      ).toBeInTheDocument();
      expect(screen.getByRole('list', { name: 'Technologies used' })).toBeInTheDocument();
    });

    it('should have proper role attributes for technology tags', () => {
      renderWithRouter(<ProjectCard project={baseProject} />);

      const techList = screen.getByRole('list', { name: 'Technologies used' });
      const techItems = within(techList).getAllByRole('listitem');
      expect(techItems.length).toBeGreaterThan(0);
    });
  });
});
