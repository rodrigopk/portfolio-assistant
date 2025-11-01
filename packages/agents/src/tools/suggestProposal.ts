import { z } from 'zod';

export const suggestProposalSchema = z.object({
  requirements: z.string().describe('Project requirements and description from the user'),
});

export type SuggestProposalInput = z.infer<typeof suggestProposalSchema>;

export async function suggestProposal(input: SuggestProposalInput) {
  const { requirements } = input;

  try {
    // This function suggests generating a formal proposal
    // The actual proposal generation would be handled by a separate agent/endpoint

    // Basic validation
    if (!requirements || requirements.trim().length < 20) {
      return {
        success: false,
        error: 'Please provide more detailed project requirements (at least 20 characters)',
        shouldGenerateProposal: false,
      };
    }

    // Extract key indicators that suggest a proposal is needed
    const proposalIndicators = [
      'estimate',
      'quote',
      'cost',
      'price',
      'budget',
      'timeline',
      'hire',
      'project',
      'build',
      'develop',
    ];

    const requirementsLower = requirements.toLowerCase();
    const hasIndicators = proposalIndicators.some((indicator) =>
      requirementsLower.includes(indicator)
    );

    return {
      success: true,
      shouldGenerateProposal: hasIndicators || requirements.length > 100,
      message: hasIndicators
        ? 'Based on your requirements, I recommend generating a detailed proposal. This would include project scope, timeline, and cost estimates tailored to your needs.'
        : 'I can help generate a detailed proposal for your project. Would you like me to create one with scope, timeline, and cost estimates?',
      nextSteps: [
        'Confirm project scope and requirements',
        'Review similar past projects',
        'Generate detailed proposal with timeline',
        'Provide cost estimate and payment terms',
      ],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      shouldGenerateProposal: false,
    };
  }
}

export const suggestProposalTool = {
  name: 'suggestProposal',
  description:
    'Analyze project requirements and recommend whether to generate a formal proposal. Use this when users discuss potential projects or ask about costs/timelines.',
  input_schema: {
    type: 'object' as const,
    properties: {
      requirements: {
        type: 'string',
        description: 'Project requirements and description from the user',
      },
    },
    required: ['requirements'],
  },
};
