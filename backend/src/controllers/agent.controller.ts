import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { agentService } from '../services/agent.service';
import { agentTools } from '../services/agent.tools';
import { sendSuccess, sendCreated } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import { prisma } from '../config/db';

/**
 * Resolves user ID from request, or falls back to standard traveler user for guest explorers
 */
async function resolveUserId(req: AuthRequest): Promise<string> {
  if (req.user && req.user.id) {
    return req.user.id;
  }

  // Find demo traveler or create guest user
  const traveler = await prisma.user.findFirst({
    where: { email: 'arjun@example.com' },
  });

  if (traveler) return traveler.id;

  const anyUser = await prisma.user.findFirst();
  if (anyUser) return anyUser.id;

  throw new BadRequestError('User account could not be resolved for agent session.');
}

export const chatWithAgent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message, conversationId } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new BadRequestError('Message content is required');
    }

    const userId = await resolveUserId(req);

    const result = await agentService.processChat({
      userId,
      conversationId,
      message: message.trim(),
    });

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Server-Sent Events (SSE) Streaming endpoint for progressive chat
 */
export const chatWithAgentStream = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { message, conversationId } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new BadRequestError('Message content is required');
    }

    const userId = await resolveUserId(req);

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const sendEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent('start', { conversationId });

    const result = await agentService.processChat({
      userId,
      conversationId,
      message: message.trim(),
      onProgress: (evt) => {
        sendEvent(evt.type, evt.data);
      },
    });

    sendEvent('final', result);
    sendEvent('done', { status: 'complete' });
    res.end();
  } catch (error) {
    next(error);
  }
};

export const getUserConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = await resolveUserId(req);
    const conversations = await agentService.getUserConversations(userId);
    sendSuccess(res, conversations);
  } catch (error) {
    next(error);
  }
};

export const getConversationById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = await resolveUserId(req);
    const conversation = await agentService.getConversationHistory(req.params.id, userId);
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }
    sendSuccess(res, conversation);
  } catch (error) {
    next(error);
  }
};

export const createConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = await resolveUserId(req);
    const { title } = req.body;
    const conversation = await agentService.getOrCreateConversation(userId, undefined, title);
    sendCreated(res, conversation);
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = await resolveUserId(req);
    await agentService.deleteConversation(req.params.id, userId);
    sendSuccess(res, { message: 'Conversation archived successfully' });
  } catch (error) {
    next(error);
  }
};

export const saveAgentItinerary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = await resolveUserId(req);
    const result = await agentTools.saveItinerary({
      ...req.body,
      userId,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const createAgentBookingProposal = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = await resolveUserId(req);
    const result = await agentTools.createBookingProposal({
      ...req.body,
      userId,
    });
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

export const getSuggestedPrompts = async (_req: AuthRequest, res: Response) => {
  const prompts = [
    {
      title: '5-Day Goa Beach & Adventure Trip',
      query: 'Plan a 5-day Goa trip for two people under ₹25,000. I prefer beaches, adventure activities and good hotels.',
      category: 'Coastal Adventure',
      icon: 'Palmtree',
    },
    {
      title: 'Romantic Kerala Backwaters Escape',
      query: 'Craft a 4-day luxury couple getaway in Kerala backwaters and Munnar tea hills with boutique stays under ₹45,000.',
      category: 'Romantic & Wellness',
      icon: 'Heart',
    },
    {
      title: 'High-Altitude Ladakh Trek & Monasteries',
      query: 'Organize a 6-day adventure in Ladakh for 2 people with camel safaris and high passes under ₹50,000.',
      category: 'Himalayan Adventure',
      icon: 'Mountain',
    },
    {
      title: 'Royal Rajasthan Heritage Circuit',
      query: 'Plan a 5-day cultural heritage tour across Jaipur and Udaipur forts for a family of 3 with historic palace stays under ₹60,000.',
      category: 'Heritage & Culture',
      icon: 'Crown',
    },
  ];

  sendSuccess(res, prompts);
};
