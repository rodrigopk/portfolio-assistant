import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Contact } from '../Contact';

describe('Contact', () => {
  it('should render the main heading', () => {
    render(<Contact />);

    expect(screen.getByRole('heading', { name: /Contact Me/i })).toBeInTheDocument();
  });

  it('should render the description', () => {
    render(<Contact />);

    expect(screen.getByText(/I'm available for part-time freelance work/)).toBeInTheDocument();
  });

  it('should render the contact form', () => {
    const { container } = render(<Contact />);

    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('should render name input field', () => {
    render(<Contact />);

    const nameInput = screen.getByLabelText(/Name/i);
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('type', 'text');
    expect(nameInput).toHaveAttribute('name', 'name');
  });

  it('should render email input field', () => {
    render(<Contact />);

    const emailInput = screen.getByLabelText(/Email/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('name', 'email');
  });

  it('should render message textarea', () => {
    render(<Contact />);

    const messageTextarea = screen.getByLabelText(/Message/i);
    expect(messageTextarea).toBeInTheDocument();
    expect(messageTextarea.tagName).toBe('TEXTAREA');
    expect(messageTextarea).toHaveAttribute('name', 'message');
    expect(messageTextarea).toHaveAttribute('rows', '4');
  });

  it('should render submit button', () => {
    render(<Contact />);

    const submitButton = screen.getByRole('button', { name: /Send Message/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  it('should have all form fields', () => {
    const { container } = render(<Contact />);

    const inputs = container.querySelectorAll('input');
    const textareas = container.querySelectorAll('textarea');

    expect(inputs).toHaveLength(2); // name and email
    expect(textareas).toHaveLength(1); // message
  });
});
