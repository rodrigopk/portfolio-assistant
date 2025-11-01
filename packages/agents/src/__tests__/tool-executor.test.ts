import { describe, it, expect, vi } from 'vitest';
import { executeTool, processToolCalls, AGENT_TOOLS } from '../utils/tool-executor';

// Mock the tools module
vi.mock('../tools', () => ({
  searchProjects: vi.fn(),
  searchProjectsTool: { name: 'searchProjects' },
  getProjectDetails: vi.fn(),
  getProjectDetailsTool: { name: 'getProjectDetails' },
  searchBlogPosts: vi.fn(),
  searchBlogPostsTool: { name: 'searchBlogPosts' },
  checkAvailability: vi.fn(),
  checkAvailabilityTool: { name: 'checkAvailability' },
  suggestProposal: vi.fn(),
  suggestProposalTool: { name: 'suggestProposal' },
}));

describe('tool-executor', () => {
  describe('AGENT_TOOLS', () => {
    it('should export an array of tools', () => {
      expect(Array.isArray(AGENT_TOOLS)).toBe(true);
      expect(AGENT_TOOLS.length).toBe(5);
    });
  });

  describe('executeTool', () => {
    it('should execute searchProjects tool', async () => {
      const { searchProjects } = await import('../tools');
      vi.mocked(searchProjects).mockResolvedValue({
        success: true,
        projects: [],
        count: 0,
      });

      const result = await executeTool('searchProjects', { query: 'test' });
      expect(searchProjects).toHaveBeenCalledWith({ query: 'test' });
      expect(result).toEqual({ success: true, projects: [], count: 0 });
    });

    it('should execute getProjectDetails tool', async () => {
      const { getProjectDetails } = await import('../tools');
      const mockProject = {
        id: '1',
        title: 'Test Project',
        slug: 'test-project',
        description: 'Test description',
        longDescription: null,
        technologies: ['React'],
        featured: false,
        category: 'web',
        githubUrl: null,
        liveUrl: null,
        imageUrl: null,
        startDate: null,
        endDate: null,
        githubStars: null,
        githubForks: null,
        lastCommit: null,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getProjectDetails).mockResolvedValue({
        success: true,
        project: mockProject,
      });

      const result = await executeTool('getProjectDetails', { projectId: '1' });
      expect(getProjectDetails).toHaveBeenCalledWith({ projectId: '1' });
      expect(result).toEqual({ success: true, project: mockProject });
    });

    it('should handle unknown tools', async () => {
      const result = await executeTool('unknownTool', {});
      expect(result).toEqual({ error: 'Unknown tool: unknownTool' });
    });

    it('should handle tool execution errors', async () => {
      const { searchProjects } = await import('../tools');
      vi.mocked(searchProjects).mockRejectedValue(new Error('Tool failed'));

      const result = await executeTool('searchProjects', { query: 'test' });
      expect(result).toEqual({ error: 'Tool failed' });
    });

    it('should handle non-Error exceptions', async () => {
      const { searchProjects } = await import('../tools');
      vi.mocked(searchProjects).mockRejectedValue('String error');

      const result = await executeTool('searchProjects', { query: 'test' });
      expect(result).toEqual({ error: 'Tool execution failed' });
    });
  });

  describe('processToolCalls', () => {
    it('should process multiple tool calls', async () => {
      const { searchProjects, getProjectDetails } = await import('../tools');
      vi.mocked(searchProjects).mockResolvedValue({
        success: true,
        projects: [],
        count: 0,
      });

      const mockProject = {
        id: '1',
        title: 'Test Project',
        slug: 'test-project',
        description: 'Test description',
        longDescription: null,
        technologies: ['React'],
        featured: false,
        category: 'web',
        githubUrl: null,
        liveUrl: null,
        imageUrl: null,
        startDate: null,
        endDate: null,
        githubStars: null,
        githubForks: null,
        lastCommit: null,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(getProjectDetails).mockResolvedValue({
        success: true,
        project: mockProject,
      });

      const toolCalls = [
        { id: 'call1', name: 'searchProjects', input: { query: 'test' } },
        { id: 'call2', name: 'getProjectDetails', input: { projectId: '1' } },
      ];

      const results = await processToolCalls(toolCalls);

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        type: 'tool_result',
        tool_use_id: 'call1',
        content: JSON.stringify({ success: true, projects: [], count: 0 }),
      });
      expect(results[1]).toEqual({
        type: 'tool_result',
        tool_use_id: 'call2',
        content: JSON.stringify({ success: true, project: mockProject }),
      });
    });

    it('should handle empty tool calls array', async () => {
      const results = await processToolCalls([]);
      expect(results).toEqual([]);
    });
  });
});
