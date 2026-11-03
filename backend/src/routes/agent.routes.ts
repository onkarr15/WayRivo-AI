import { Router } from 'express';
import {
  chatWithAgent,
  chatWithAgentStream,
  getUserConversations,
  getConversationById,
  createConversation,
  deleteConversation,
  saveAgentItinerary,
  createAgentBookingProposal,
  getSuggestedPrompts,
} from '../controllers/agent.controller';
import { optionalAuthenticate } from '../middleware/auth.middleware';

const router = Router();

// Conversational AI Chat
router.post('/chat', optionalAuthenticate, chatWithAgent);
router.post('/chat/stream', optionalAuthenticate, chatWithAgentStream);

// Conversation Sessions
router.get('/conversations', optionalAuthenticate, getUserConversations);
router.post('/conversations', optionalAuthenticate, createConversation);
router.get('/conversations/:id', optionalAuthenticate, getConversationById);
router.delete('/conversations/:id', optionalAuthenticate, deleteConversation);

// Agent Direct Actions
router.post('/save-itinerary', optionalAuthenticate, saveAgentItinerary);
router.post('/create-proposal', optionalAuthenticate, createAgentBookingProposal);
router.get('/suggested-prompts', getSuggestedPrompts);

export default router;
