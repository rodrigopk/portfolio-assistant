import {
  searchProjects,
  searchProjectsTool,
  getProjectDetails,
  getProjectDetailsTool,
  searchBlogPosts,
  searchBlogPostsTool,
  checkAvailability,
  checkAvailabilityTool,
  suggestProposal,
  suggestProposalTool,
} from '../tools';

/**
 * Available tools for the chat agent
 */
export const AGENT_TOOLS = [
  searchProjectsTool,
  getProjectDetailsTool,
  searchBlogPostsTool,
  checkAvailabilityTool,
  suggestProposalTool,
];

/**
 * Execute a tool call by name with the provided input
 */
export async function executeTool(toolName: string, toolInput: Record<string, unknown>) {
  try {
    switch (toolName) {
      case 'searchProjects':
        return await searchProjects(toolInput as Parameters<typeof searchProjects>[0]);
      case 'getProjectDetails':
        return await getProjectDetails(toolInput as Parameters<typeof getProjectDetails>[0]);
      case 'searchBlogPosts':
        return await searchBlogPosts(toolInput as Parameters<typeof searchBlogPosts>[0]);
      case 'checkAvailability':
        return await checkAvailability(toolInput as Parameters<typeof checkAvailability>[0]);
      case 'suggestProposal':
        return await suggestProposal(toolInput as Parameters<typeof suggestProposal>[0]);
      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Tool execution failed',
    };
  }
}

/**
 * Tool call result type for API responses
 */
export interface ToolResult {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
}

/**
 * Process tool calls from Claude's response and execute them
 */
export async function processToolCalls(toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }>): Promise<ToolResult[]> {
  return Promise.all(
    toolCalls.map(async (call) => ({
      type: 'tool_result' as const,
      tool_use_id: call.id,
      content: JSON.stringify(await executeTool(call.name, call.input)),
    }))
  );
}