import { describe, it, expect } from 'vitest';
import { suggestProposal } from '../tools/suggestProposal';

describe('suggestProposal', () => {
  it('should suggest proposal for detailed requirements', async () => {
    const requirements =
      'I need a full-stack web application with user authentication, dashboard, and reporting features. Budget around $10k.';

    const result = await suggestProposal({ requirements });

    expect(result.success).toBe(true);
    expect(result.shouldGenerateProposal).toBe(true);
    expect(result.message).toContain('recommend');
    expect(result.nextSteps).toBeDefined();
    expect(result.nextSteps?.length).toBeGreaterThan(0);
  });

  it('should suggest proposal when budget-related keywords are present', async () => {
    const requirements = 'What would it cost to build a mobile app?';

    const result = await suggestProposal({ requirements });

    expect(result.success).toBe(true);
    expect(result.shouldGenerateProposal).toBe(true);
  });

  it('should suggest proposal for project-related inquiries', async () => {
    const requirements = 'I want to hire you to develop an e-commerce platform.';

    const result = await suggestProposal({ requirements });

    expect(result.success).toBe(true);
    expect(result.shouldGenerateProposal).toBe(true);
  });

  it('should handle short but valid requirements', async () => {
    const requirements = 'I need an estimate for a simple website.';

    const result = await suggestProposal({ requirements });

    expect(result.success).toBe(true);
    expect(result.shouldGenerateProposal).toBe(true);
  });

  it('should suggest proposal for timeline inquiries', async () => {
    const requirements = 'How long would it take to build a custom CRM system?';

    const result = await suggestProposal({ requirements });

    expect(result.success).toBe(true);
    expect(result.shouldGenerateProposal).toBe(true);
  });

  it('should return error for too short requirements', async () => {
    const requirements = 'Build app';

    const result = await suggestProposal({ requirements });

    expect(result.success).toBe(false);
    expect(result.error).toContain('more detailed');
    expect(result.shouldGenerateProposal).toBe(false);
  });

  it('should return error for empty requirements', async () => {
    const requirements = '';

    const result = await suggestProposal({ requirements });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return error for whitespace-only requirements', async () => {
    const requirements = '   ';

    const result = await suggestProposal({ requirements });

    expect(result.success).toBe(false);
    expect(result.shouldGenerateProposal).toBe(false);
  });

  it('should suggest proposal for very long requirements', async () => {
    const requirements =
      'I need a comprehensive enterprise solution with multiple modules including inventory management, customer relationship management, financial reporting, employee management, and integration with third-party services. The system should support multiple users with role-based access control.';

    const result = await suggestProposal({ requirements });

    expect(result.success).toBe(true);
    expect(result.shouldGenerateProposal).toBe(true);
  });

  it('should provide next steps', async () => {
    const requirements = 'I need help building a web application with React and Node.js';

    const result = await suggestProposal({ requirements });

    expect(result.nextSteps).toBeDefined();
    expect(Array.isArray(result.nextSteps)).toBe(true);
    expect(result.nextSteps?.length).toBeGreaterThan(0);
  });
});
