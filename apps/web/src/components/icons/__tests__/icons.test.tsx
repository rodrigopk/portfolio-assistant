import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AlertIcon } from '../AlertIcon';
import { ChatIcon } from '../ChatIcon';
import { CloseIcon } from '../CloseIcon';
import { RefreshIcon } from '../RefreshIcon';
import { SendIcon } from '../SendIcon';
import { TrashIcon } from '../TrashIcon';

describe('Icon Components', () => {
  describe('AlertIcon', () => {
    it('should render with default className', () => {
      const { container } = render(<AlertIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-5', 'w-5');
    });

    it('should render with custom className', () => {
      const { container } = render(<AlertIcon className="h-10 w-10 text-red-500" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-10', 'w-10', 'text-red-500');
    });

    it('should have proper SVG attributes', () => {
      const { container } = render(<AlertIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 20 20');
      expect(svg).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('ChatIcon', () => {
    it('should render with default className', () => {
      const { container } = render(<ChatIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-6', 'w-6');
    });

    it('should render with custom className', () => {
      const { container } = render(<ChatIcon className="h-8 w-8" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-8', 'w-8');
    });

    it('should have proper SVG attributes', () => {
      const { container } = render(<ChatIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
    });
  });

  describe('CloseIcon', () => {
    it('should render with default className', () => {
      const { container } = render(<CloseIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-5', 'w-5');
    });

    it('should render with custom className', () => {
      const { container } = render(<CloseIcon className="h-6 w-6" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-6', 'w-6');
    });

    it('should have proper SVG attributes', () => {
      const { container } = render(<CloseIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 20 20');
      expect(svg).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('RefreshIcon', () => {
    it('should render with default className', () => {
      const { container } = render(<RefreshIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-5', 'w-5');
    });

    it('should render with custom className', () => {
      const { container } = render(<RefreshIcon className="h-4 w-4" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-4', 'w-4');
    });

    it('should have proper SVG attributes', () => {
      const { container } = render(<RefreshIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 20 20');
      expect(svg).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('SendIcon', () => {
    it('should render with default className', () => {
      const { container } = render(<SendIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-5', 'w-5');
    });

    it('should render with custom className', () => {
      const { container } = render(<SendIcon className="h-7 w-7" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-7', 'w-7');
    });

    it('should have proper SVG attributes', () => {
      const { container } = render(<SendIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 20 20');
      expect(svg).toHaveAttribute('fill', 'currentColor');
    });
  });

  describe('TrashIcon', () => {
    it('should render with default className', () => {
      const { container } = render(<TrashIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('h-5', 'w-5');
    });

    it('should render with custom className', () => {
      const { container } = render(<TrashIcon className="h-6 w-6 text-red-600" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-6', 'w-6', 'text-red-600');
    });

    it('should have proper SVG attributes', () => {
      const { container } = render(<TrashIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 20 20');
      expect(svg).toHaveAttribute('fill', 'currentColor');
    });
  });
});
