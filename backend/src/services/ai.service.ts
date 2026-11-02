import { geminiClient, GeminiPlanRequest } from '../integrations/gemini/client';
import { prisma } from '../config/db';
import { AgentActionType, AgentActionStatus, MessageSender } from '@prisma/client';

export class AiService {
  async planJourney(params: GeminiPlanRequest & { userId?: string; conversationId?: string }) {
    const startTime = Date.now();
    const result = await geminiClient.generateItineraryPlan(params);
    const durationMs = Date.now() - startTime;

    // If conversationId provided, record agent action and assistant message
    if (params.conversationId) {
      await prisma.agentAction.create({
        data: {
          conversationId: params.conversationId,
          actionType: AgentActionType.GENERATE_ITINERARY,
          toolInput: params as any,
          toolOutput: result as any,
          executionMs: durationMs,
          status: AgentActionStatus.SUCCESS,
        },
      });

      await prisma.message.create({
        data: {
          conversationId: params.conversationId,
          sender: MessageSender.ASSISTANT,
          content: result.summary,
          metadata: result as any,
        },
      });
    }

    return result;
  }
}

export const aiService = new AiService();
