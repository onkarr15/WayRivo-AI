import { prisma } from '../config/db';
import { env } from '../config/env';
import { agentTools } from './agent.tools';
import { logger } from '../utils/logger';

// -------------------------------------------------------------
// GEMINI TOOL DECLARATIONS SCHEMA
// -------------------------------------------------------------
export const geminiToolDeclarations = [
  {
    name: 'search_destinations',
    description: 'Search curated travel destinations in India by name, state, or budget range.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: { type: 'STRING', description: 'Destination name or keyword (e.g. Goa, Kerala, Rajasthan)' },
        state: { type: 'STRING', description: 'State filter (e.g. Goa, Kerala, Himachal Pradesh)' },
        minBudget: { type: 'NUMBER', description: 'Minimum budget in INR' },
        maxBudget: { type: 'NUMBER', description: 'Maximum budget in INR' },
      },
    },
  },
  {
    name: 'search_hotels',
    description: 'Find verified hotel accommodations in a destination with real prices, star tiers, and available rooms.',
    parameters: {
      type: 'OBJECT',
      properties: {
        destinationName: { type: 'STRING', description: 'Destination name (e.g. Goa, Kerala, Ladakh)' },
        destinationId: { type: 'STRING', description: 'Specific destination ID' },
        minStars: { type: 'NUMBER', description: 'Minimum star rating (e.g. 3, 4, 5)' },
        maxPrice: { type: 'NUMBER', description: 'Maximum nightly price in INR' },
        sortBy: { type: 'STRING', description: 'Sort by price_asc, price_desc, or rating' },
      },
    },
  },
  {
    name: 'search_activities',
    description: 'Find curated travel excursions, adventures, and cultural experiences with real pricing and slot availability.',
    parameters: {
      type: 'OBJECT',
      properties: {
        destinationName: { type: 'STRING', description: 'Destination name (e.g. Goa, Kerala, Manali)' },
        destinationId: { type: 'STRING', description: 'Specific destination ID' },
        category: { type: 'STRING', description: 'Category: Adventure activities, Sightseeing, Water sports, Cultural experiences' },
        maxPrice: { type: 'NUMBER', description: 'Maximum price per person in INR' },
      },
    },
  },
  {
    name: 'search_packages',
    description: 'Search verified all-inclusive agency travel packages with agency ratings, inclusions, and seat limits.',
    parameters: {
      type: 'OBJECT',
      properties: {
        destinationName: { type: 'STRING', description: 'Destination name' },
        destinationId: { type: 'STRING', description: 'Specific destination ID' },
        maxPrice: { type: 'NUMBER', description: 'Maximum package price in INR' },
        isRecommended: { type: 'BOOLEAN', description: 'Filter by staff-recommended verified packages' },
      },
    },
  },
  {
    name: 'get_hotel_details',
    description: 'Retrieve detailed information for a specific hotel including amenities, room types, and live available rooms.',
    parameters: {
      type: 'OBJECT',
      properties: {
        hotelId: { type: 'STRING', description: 'The unique ID of the hotel' },
      },
      required: ['hotelId'],
    },
  },
  {
    name: 'check_inventory_availability',
    description: 'Check real-time inventory capacity for a hotel, activity, or package before confirming recommendations.',
    parameters: {
      type: 'OBJECT',
      properties: {
        itemType: { type: 'STRING', enum: ['HOTEL', 'ACTIVITY', 'PACKAGE'], description: 'Type of inventory item' },
        itemId: { type: 'STRING', description: 'Unique ID of the item' },
        requestedQuantity: { type: 'NUMBER', description: 'Number of rooms, tickets, or package seats requested' },
        dates: { type: 'STRING', description: 'Optional travel date range' },
      },
      required: ['itemType', 'itemId', 'requestedQuantity'],
    },
  },
  {
    name: 'calculate_trip_budget',
    description: 'Calculate deterministic budget expenditure based on real hotel rates, activity tickets, dining, and transport.',
    parameters: {
      type: 'OBJECT',
      properties: {
        destinationName: { type: 'STRING', description: 'Destination name' },
        destinationId: { type: 'STRING', description: 'Destination ID' },
        numberOfDays: { type: 'NUMBER', description: 'Duration of trip in days' },
        travelersCount: { type: 'NUMBER', description: 'Number of travelers' },
        hotelId: { type: 'STRING', description: 'Optional chosen hotel ID' },
        activityIds: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Array of chosen activity IDs' },
        travelStyle: { type: 'STRING', description: 'Travel style: budget, moderate, luxury' },
        totalUserBudget: { type: 'NUMBER', description: 'User total budget cap in INR' },
      },
      required: ['numberOfDays', 'travelersCount'],
    },
  },
  {
    name: 'generate_itinerary',
    description: 'Synthesize a structured day-by-day itinerary integrating selected real hotels, curated activities, and landmarks.',
    parameters: {
      type: 'OBJECT',
      properties: {
        destinationName: { type: 'STRING', description: 'Destination name' },
        destinationId: { type: 'STRING', description: 'Destination ID' },
        numberOfDays: { type: 'NUMBER', description: 'Duration in days' },
        travelersCount: { type: 'NUMBER', description: 'Number of travelers' },
        hotelId: { type: 'STRING', description: 'Optional chosen hotel ID' },
        activityIds: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Array of activity IDs' },
        travelStyle: { type: 'STRING', description: 'Travel style' },
        budget: { type: 'NUMBER', description: 'Total budget in INR' },
      },
      required: ['numberOfDays', 'travelersCount'],
    },
  },
  {
    name: 'save_itinerary',
    description: 'Persist the crafted itinerary to the user profile in PostgreSQL database.',
    parameters: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: 'Descriptive title for itinerary' },
        destinationName: { type: 'STRING', description: 'Destination name' },
        destinationId: { type: 'STRING', description: 'Destination ID' },
        numberOfDays: { type: 'NUMBER', description: 'Duration in days' },
        travelersCount: { type: 'NUMBER', description: 'Number of travelers' },
        budget: { type: 'NUMBER', description: 'Total budget' },
        travelStyle: { type: 'STRING', description: 'Travel style' },
        days: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              dayNumber: { type: 'NUMBER' },
              title: { type: 'STRING' },
              morning: { type: 'STRING' },
              afternoon: { type: 'STRING' },
              evening: { type: 'STRING' },
              mealsIncluded: { type: 'ARRAY', items: { type: 'STRING' } },
              accommodationNotes: { type: 'STRING' },
              activitiesNotes: { type: 'STRING' },
              estimatedDayCost: { type: 'NUMBER' },
            },
          },
        },
      },
      required: ['title', 'numberOfDays', 'travelersCount', 'days'],
    },
  },
  {
    name: 'create_booking_proposal',
    description: 'Create an unconfirmed booking proposal in PENDING_PAYMENT state. Never claims payment is captured.',
    parameters: {
      type: 'OBJECT',
      properties: {
        itineraryId: { type: 'STRING', description: 'Optional saved itinerary ID' },
        hotelId: { type: 'STRING', description: 'Selected hotel ID' },
        activityIds: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Selected activity IDs' },
        packageId: { type: 'STRING', description: 'Selected package ID' },
        specialRequests: { type: 'STRING', description: 'Traveler special requests' },
        requestedNights: { type: 'NUMBER', description: 'Nights requested' },
        travelersCount: { type: 'NUMBER', description: 'Number of travelers' },
      },
    },
  },
];

const SYSTEM_INSTRUCTION = `You are WayRivo AI 2.0, an intelligent autonomous travel planning architect.
Your mission is to understand user requests, extract travel requirements, query verified database tools, compare available inventory, calculate budgets, and present personalized itineraries.

CORE OPERATIONAL RULES:
1. TRUTH IN INVENTORY: Never invent prices, hotel ratings, room availability, or slot counts. Always call backend tools (search_destinations, search_hotels, search_activities, search_packages) to retrieve actual database records.
2. SAFE BOOKINGS: Never claim a reservation is booked or payment is confirmed without explicit user payment. The create_booking_proposal tool creates an unconfirmed proposal in PENDING_PAYMENT state only.
3. BUDGET TRANSPARENCY: Always call calculate_trip_budget to provide realistic, itemized expenditure breakdowns with a contingency buffer.
4. STRUCTURED EXCELLENCE: Highlight selected hotels and activities clearly so the conversational UI can render interactive cards.
5. CONVERSATIONAL TONE: Be warm, knowledgeable, concise, and proactive. Encourage travelers to customize or modify their trip.
6. NO HASHTAGS OR RAW MARKDOWN HEADINGS: Never use hashtags (#, ##, ###, ####) for headings or formatting in your responses. Present headings and section titles cleanly using bold text (e.g., **Recommended Destination**, **Verified Stays & Excursions**) or emojis instead.`;

export function cleanHashtagsFromText(text: string): string {
  if (!text) return '';
  return text
    .split('\n')
    .map((line) => line.replace(/^#{1,6}\s*/, ''))
    .join('\n');
}

export class AgentService {
  /**
   * Retrieves or creates a conversation session in PostgreSQL
   */
  async getOrCreateConversation(userId: string, conversationId?: string, title?: string) {
    if (conversationId) {
      const existing = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: { orderBy: { createdAt: 'asc' } },
        },
      });
      if (existing) return existing;
    }

    // Create new conversation
    return prisma.conversation.create({
      data: {
        userId,
        title: title || 'Trip Planning Session',
        status: 'ACTIVE',
      },
      include: {
        messages: true,
      },
    });
  }

  /**
   * List conversations for a user
   */
  async getUserConversations(userId: string) {
    return prisma.conversation.findMany({
      where: { userId, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    });
  }

  /**
   * Get dialogue history for a specific conversation
   */
  async getConversationHistory(conversationId: string, userId: string) {
    return prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        agentActions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  /**
   * Archive/delete conversation
   */
  async deleteConversation(conversationId: string, userId: string) {
    return prisma.conversation.updateMany({
      where: { id: conversationId, userId },
      data: { status: 'ARCHIVED' },
    });
  }

  /**
   * Execute an authorized agent tool by name
   */
  async executeTool(name: string, args: any, conversationId?: string, userId?: string) {
    switch (name) {
      case 'search_destinations':
        return agentTools.searchDestinations(args, conversationId);
      case 'search_hotels':
        return agentTools.searchHotels(args, conversationId);
      case 'search_activities':
        return agentTools.searchActivities(args, conversationId);
      case 'search_packages':
        return agentTools.searchPackages(args, conversationId);
      case 'get_hotel_details':
        return agentTools.getHotelDetails(args, conversationId);
      case 'check_inventory_availability':
        return agentTools.checkInventoryAvailability(args, conversationId);
      case 'calculate_trip_budget':
        return agentTools.calculateTripBudget(args, conversationId);
      case 'generate_itinerary':
        return agentTools.generateItinerary(args, conversationId);
      case 'save_itinerary':
        return agentTools.saveItinerary({ ...args, userId: userId || '' }, conversationId);
      case 'create_booking_proposal':
        return agentTools.createBookingProposal({ ...args, userId: userId || '' }, conversationId);
      default:
        return { success: false, error: `Unauthorized or unknown tool: ${name}` };
    }
  }

  /**
   * Core Autonomous Chat Pipeline
   */
  async processChat(params: {
    userId: string;
    conversationId?: string;
    message: string;
    onProgress?: (event: { type: string; data: any }) => void;
  }) {
    const { userId, message, onProgress } = params;

    // 1. Resolve conversation
    const conversation = await this.getOrCreateConversation(userId, params.conversationId);
    const convId = conversation.id;

    // 2. Persist User Message
    await prisma.message.create({
      data: {
        conversationId: convId,
        sender: 'USER',
        content: message,
      },
    });

    onProgress?.({ type: 'status', data: 'WayRivo AI is analyzing your travel requirements...' });

    // Track tools executed in this turn
    const executedToolsLog: Array<{ tool: string; input: any; result: any; latencyMs: number }> = [];
    const richMetadata: {
      destinations: any[];
      hotels: any[];
      activities: any[];
      packages: any[];
      itinerary: any | null;
      budgetAnalysis: any | null;
      bookingProposal: any | null;
      toolsExecuted: any[];
      suggestedActions: string[];
    } = {
      destinations: [],
      hotels: [],
      activities: [],
      packages: [],
      itinerary: null,
      budgetAnalysis: null,
      bookingProposal: null,
      toolsExecuted: [],
      suggestedActions: [],
    };

    let responseText = '';

    // Check if we can invoke real Gemini API
    const isLiveGeminiAvailable =
      env.GEMINI_API_KEY &&
      !env.GEMINI_API_KEY.startsWith('AIzaSy_Demo') &&
      env.GEMINI_API_KEY.length > 20;

    if (isLiveGeminiAvailable) {
      try {
        responseText = await this.runGeminiLoop({
          message,
          conversationId: convId,
          userId,
          history: conversation.messages || [],
          onProgress,
          executedToolsLog,
          richMetadata,
        });
      } catch (geminiError) {
        logger.warn('Gemini API execution encountered an error, activating deterministic autonomous agent fallback:', geminiError);
        responseText = await this.runDeterministicAgent({
          message,
          conversationId: convId,
          userId,
          onProgress,
          executedToolsLog,
          richMetadata,
        });
      }
    } else {
      // High-precision Deterministic Autonomous Travel Agent
      responseText = await this.runDeterministicAgent({
        message,
        conversationId: convId,
        userId,
        onProgress,
        executedToolsLog,
        richMetadata,
      });
    }

    richMetadata.toolsExecuted = executedToolsLog;

    // Default suggested actions if not set
    if (richMetadata.suggestedActions.length === 0) {
      richMetadata.suggestedActions = [
        'Save this Itinerary',
        'Explore 4-Star Hotel Alternatives',
        'Adjust Daily Budget',
        'Prepare Booking Proposal',
      ];
    }

    // Sanitize any hashtags from the response text
    responseText = cleanHashtagsFromText(responseText);

    // 3. Persist Assistant Response in PostgreSQL
    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: convId,
        sender: 'ASSISTANT',
        content: responseText,
        metadata: richMetadata as any,
      },
    });

    // Update conversation title if default
    if (conversation.title === 'Trip Planning Session') {
      const extractedDest = richMetadata.destinations[0]?.name || richMetadata.itinerary?.destinationName;
      if (extractedDest) {
        await prisma.conversation.update({
          where: { id: convId },
          data: { title: `${extractedDest} Trip Plan`, updatedAt: new Date() },
        });
      }
    }

    return {
      conversationId: convId,
      messageId: assistantMessage.id,
      reply: responseText,
      metadata: richMetadata,
    };
  }

  /**
   * Gemini Tool-Calling Reasoning Loop (Google Gemini REST API)
   */
  private async runGeminiLoop(params: {
    message: string;
    conversationId: string;
    userId: string;
    history: any[];
    onProgress?: (event: any) => void;
    executedToolsLog: any[];
    richMetadata: any;
  }): Promise<string> {
    const { message, conversationId, userId, history, onProgress, executedToolsLog, richMetadata } = params;

    const contents: any[] = [];

    // Append up to 6 recent history turns
    const recent = history.slice(-6);
    for (const h of recent) {
      contents.push({
        role: h.sender === 'USER' ? 'user' : 'model',
        parts: [{ text: h.content }],
      });
    }

    // Current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

    let maxTurns = 5;
    while (maxTurns > 0) {
      maxTurns--;

      const body = {
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        tools: [{ functionDeclarations: geminiToolDeclarations }],
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        throw new Error(`Gemini API HTTP ${res.status}: ${await res.text()}`);
      }

      const data = (await res.json()) as any;
      const candidate = data.candidates?.[0];
      if (!candidate) throw new Error('No candidates returned from Gemini');

      const modelParts = candidate.content?.parts || [];
      const functionCalls = modelParts.filter((p: any) => p.functionCall);

      if (functionCalls.length === 0) {
        // Final text response reached
        const textPart = modelParts.find((p: any) => p.text);
        return textPart ? textPart.text : 'I have analyzed your request based on live inventory.';
      }

      // Add model's function call message to dialogue
      contents.push(candidate.content);

      // Execute each tool call
      const functionResponseParts = [];
      for (const call of functionCalls) {
        const fnName = call.functionCall.name;
        const fnArgs = call.functionCall.args || {};

        onProgress?.({
          type: 'tool_call',
          data: { tool: fnName, args: fnArgs },
        });

        const start = Date.now();
        const toolResult: any = await this.executeTool(fnName, fnArgs, conversationId, userId);
        const lat = Date.now() - start;

        executedToolsLog.push({
          tool: fnName,
          input: fnArgs,
          result: toolResult,
          latencyMs: lat,
        });

        // Store into rich metadata for frontend rendering
        if (fnName === 'search_destinations' && toolResult.destinations) {
          richMetadata.destinations = toolResult.destinations;
        } else if (fnName === 'search_hotels' && toolResult.hotels) {
          richMetadata.hotels = toolResult.hotels;
        } else if (fnName === 'search_activities' && toolResult.activities) {
          richMetadata.activities = toolResult.activities;
        } else if (fnName === 'search_packages' && toolResult.packages) {
          richMetadata.packages = toolResult.packages;
        } else if (fnName === 'calculate_trip_budget' && toolResult.success) {
          richMetadata.budgetAnalysis = toolResult;
        } else if (fnName === 'generate_itinerary' && toolResult.success) {
          richMetadata.itinerary = toolResult;
        } else if (fnName === 'create_booking_proposal' && toolResult.success) {
          richMetadata.bookingProposal = toolResult;
        }

        functionResponseParts.push({
          functionResponse: {
            name: fnName,
            response: toolResult,
          },
        });
      }

      // Append function response to contents
      contents.push({
        role: 'user',
        parts: functionResponseParts,
      });
    }

    return 'I have compiled your travel recommendations and itinerary based on live inventory.';
  }

  /**
   * Deterministic Autonomous Travel Agent (Extracts intent and executes real backend tools)
   */
  private async runDeterministicAgent(params: {
    message: string;
    conversationId: string;
    userId: string;
    onProgress?: (event: any) => void;
    executedToolsLog: any[];
    richMetadata: any;
  }): Promise<string> {
    const { message, conversationId, userId, onProgress, executedToolsLog, richMetadata } = params;
    const lower = message.toLowerCase();

    // 1. Natural Language Extraction
    let targetDest = 'Goa'; // default fallback
    const knownDestinations = [
      'kerala',
      'rajasthan',
      'goa',
      'ladakh',
      'manali',
      'andaman',
      'varanasi',
      'meghalaya',
      'jaipur',
      'udaipur',
      'munnar',
    ];

    for (const d of knownDestinations) {
      if (lower.includes(d)) {
        targetDest = d === 'jaipur' || d === 'udaipur' ? 'rajasthan' : d === 'munnar' ? 'kerala' : d;
        break;
      }
    }

    // Extract duration (e.g. "5-day", "5 days", "3 nights")
    let duration = 5;
    const dayMatch = lower.match(/(\d+)\s*(-|\s)?(day|days)/);
    if (dayMatch) duration = parseInt(dayMatch[1]);

    // Extract travelers (e.g. "two people", "2 travelers", "couple", "family of 4")
    let travelers = 2;
    if (lower.includes('solo') || lower.includes('alone') || lower.includes('1 person')) travelers = 1;
    if (lower.includes('two') || lower.includes('couple') || lower.includes('2 people') || lower.includes('2 travelers')) travelers = 2;
    const travMatch = lower.match(/(\d+)\s*(people|persons|travelers|guests)/);
    if (travMatch) travelers = parseInt(travMatch[1]);

    // Extract budget (e.g. "under ₹25,000", "25000", "50k")
    let budget = 25000;
    const budgetMatch = lower.match(/(₹|rs\.?|inr)?\s*(\d{1,3}(,\d{3})*|\d+)(k)?/i);
    if (budgetMatch) {
      const rawNum = budgetMatch[2].replace(/,/g, '');
      let parsed = parseInt(rawNum);
      if (budgetMatch[4]?.toLowerCase() === 'k') parsed *= 1000;
      if (parsed >= 5000) budget = parsed;
    }

    // Extract style / interests
    let travelStyle = 'Balanced Exploration';
    if (lower.includes('luxury') || lower.includes('resort') || lower.includes('5-star')) travelStyle = 'Luxury & Wellness';
    if (lower.includes('budget') || lower.includes('backpack') || lower.includes('cheap')) travelStyle = 'Budget Adventure';
    if (lower.includes('beach') || lower.includes('water')) travelStyle = 'Coastal Leisure & Water Sports';

    onProgress?.({ type: 'status', data: `Querying live database records for ${targetDest.toUpperCase()}...` });

    // 2. Step 1 Tool Call: search_destinations
    const destStart = Date.now();
    const destResult: any = await agentTools.searchDestinations({ query: targetDest }, conversationId);
    executedToolsLog.push({ tool: 'search_destinations', input: { query: targetDest }, result: destResult, latencyMs: Date.now() - destStart });
    richMetadata.destinations = destResult.destinations || [];
    const destObj = destResult.destinations?.[0];

    // 3. Step 2 Tool Call: search_hotels
    onProgress?.({ type: 'status', data: `Checking hotel inventory & live room availability...` });
    const hotelStart = Date.now();
    const hotelResult: any = await agentTools.searchHotels({ destinationName: targetDest, minStars: lower.includes('luxury') ? 4 : undefined }, conversationId);
    executedToolsLog.push({ tool: 'search_hotels', input: { destinationName: targetDest }, result: hotelResult, latencyMs: Date.now() - hotelStart });
    richMetadata.hotels = hotelResult.hotels || [];
    const selectedHotel = hotelResult.hotels?.[0];

    // 4. Step 3 Tool Call: search_activities
    onProgress?.({ type: 'status', data: `Curating verified local excursions & activities...` });
    const actStart = Date.now();
    const actResult: any = await agentTools.searchActivities({ destinationName: targetDest }, conversationId);
    executedToolsLog.push({ tool: 'search_activities', input: { destinationName: targetDest }, result: actResult, latencyMs: Date.now() - actStart });
    richMetadata.activities = actResult.activities || [];
    const selectedActivities = (actResult.activities || []).slice(0, 2);

    // 5. Step 4 Tool Call: search_packages
    const pkgStart = Date.now();
    const pkgResult: any = await agentTools.searchPackages({ destinationName: targetDest }, conversationId);
    executedToolsLog.push({ tool: 'search_packages', input: { destinationName: targetDest }, result: pkgResult, latencyMs: Date.now() - pkgStart });
    richMetadata.packages = pkgResult.packages || [];

    // 6. Step 5 Tool Call: calculate_trip_budget
    onProgress?.({ type: 'status', data: `Calculating deterministic expenditure breakdown...` });
    const budgetStart = Date.now();
    const budgetResult: any = await agentTools.calculateTripBudget(
      {
        destinationName: targetDest,
        destinationId: destObj?.id,
        numberOfDays: duration,
        travelersCount: travelers,
        hotelId: selectedHotel?.id,
        activityIds: selectedActivities.map((a: any) => a.id),
        travelStyle,
        totalUserBudget: budget,
      },
      conversationId
    );
    executedToolsLog.push({ tool: 'calculate_trip_budget', input: { destination: targetDest, budget }, result: budgetResult, latencyMs: Date.now() - budgetStart });
    richMetadata.budgetAnalysis = budgetResult;

    // 7. Step 6 Tool Call: generate_itinerary
    onProgress?.({ type: 'status', data: `Structuring day-by-day itinerary...` });
    const itinStart = Date.now();
    const itinResult: any = await agentTools.generateItinerary(
      {
        destinationName: targetDest,
        destinationId: destObj?.id,
        numberOfDays: duration,
        travelersCount: travelers,
        hotelId: selectedHotel?.id,
        activityIds: selectedActivities.map((a: any) => a.id),
        travelStyle,
        budget,
      },
      conversationId
    );
    executedToolsLog.push({ tool: 'generate_itinerary', input: { destination: targetDest, days: duration }, result: itinResult, latencyMs: Date.now() - itinStart });
    richMetadata.itinerary = itinResult;

    // 8. If user specifically asks to save or book, execute those tools
    if (lower.includes('save') && lower.includes('itinerary')) {
      const saveStart = Date.now();
      const saveRes: any = await agentTools.saveItinerary(
        {
          userId,
          title: `${itinResult.destinationName} ${duration}-Day Itinerary`,
          destinationId: destObj?.id,
          destinationName: itinResult.destinationName,
          numberOfDays: duration,
          travelersCount: travelers,
          budget,
          travelStyle,
          days: itinResult.days,
        },
        conversationId
      );
      executedToolsLog.push({ tool: 'save_itinerary', input: { title: itinResult.destinationName }, result: saveRes, latencyMs: Date.now() - saveStart });
      if (saveRes.success) {
        richMetadata.savedItineraryId = saveRes.itineraryId;
        richMetadata.suggestedActions.push('Prepare Booking Proposal');
      }
    }

    if (lower.includes('book') || lower.includes('proposal') || lower.includes('confirm')) {
      const bookStart = Date.now();
      const bookRes: any = await agentTools.createBookingProposal(
        {
          userId,
          hotelId: selectedHotel?.id,
          activityIds: selectedActivities.map((a: any) => a.id),
          requestedNights: Math.max(1, duration - 1),
          travelersCount: travelers,
        },
        conversationId
      );
      executedToolsLog.push({ tool: 'create_booking_proposal', input: { hotel: selectedHotel?.name }, result: bookRes, latencyMs: Date.now() - bookStart });
      richMetadata.bookingProposal = bookRes;
    }

    // 9. Natural Language Synthesis with Live Inventory Grounding
    const destName = destObj?.name || targetDest.toUpperCase();
    const totalCostStr = budgetResult.totalCalculatedCost ? `₹${budgetResult.totalCalculatedCost.toLocaleString('en-IN')}` : `₹${budget.toLocaleString('en-IN')}`;
    const budgetStatusNote =
      budgetResult.budgetStatus === 'OPTIMAL'
        ? `Within your target budget with ₹${budgetResult.remainingBalance?.toLocaleString('en-IN')} contingency cushion.`
        : budgetResult.budgetStatus === 'LUXURY_SURPLUS'
        ? `Surplus budget available! You have ₹${budgetResult.remainingBalance?.toLocaleString('en-IN')} remaining.`
        : `Slightly exceeds target budget by ₹${Math.abs(budgetResult.remainingBalance || 0).toLocaleString('en-IN')}. Consider switching to a 3-star property.`;

    const hotelHighlight = selectedHotel
      ? `• **Accommodation**: **${selectedHotel.name}** (${selectedHotel.stars}★, ₹${selectedHotel.pricePerNight.toLocaleString('en-IN')}/night, ${selectedHotel.availableRooms} rooms available)`
      : '• **Accommodation**: Curated boutique stay matched to your travel style.';

    const actHighlights = selectedActivities.length > 0
      ? selectedActivities.map((a: any) => `• **Curated Excursion**: ${a.title} (${a.category}, ₹${a.pricePerPerson.toLocaleString('en-IN')}/person, ${a.availableSlots} slots remaining)`).join('\n')
      : '• **Activities**: Scenic beach exploration, sunset viewpoints, and regional artisan markets.';

    const reply = `🌟 **Your Personalized ${duration}-Day ${destName} Travel Plan**

I have analyzed your request for **${travelers} traveler(s)** and queried our live database inventory.

📍 **Recommended Destination**
**${destName}** (${destObj?.state || 'India'})
${destObj?.description || 'A world-class destination offering rich heritage, vibrant coastal sights, and serene vistas.'}
*Best time to visit*: **${destObj?.bestTimeToVisit || 'October to March'}**.

🏨 **Verified Stays & Excursions**
${hotelHighlight}
${actHighlights}

📊 **Live Budget Breakdown (Total: ${totalCostStr})**
- **Stay**: ₹${budgetResult.breakdown?.accommodation?.toLocaleString('en-IN')} (${budgetResult.breakdownPercentage?.accommodation || 45}%)
- **Activities**: ₹${budgetResult.breakdown?.activities?.toLocaleString('en-IN')} (${budgetResult.breakdownPercentage?.activities || 20}%)
- **Dining**: ₹${budgetResult.breakdown?.mealsAndDining?.toLocaleString('en-IN')} (${budgetResult.breakdownPercentage?.mealsAndDining || 25}%)
- **Transport**: ₹${budgetResult.breakdown?.localTransport?.toLocaleString('en-IN')} (${budgetResult.breakdownPercentage?.localTransport || 10}%)
*Status*: **${budgetResult.budgetStatus}** — ${budgetStatusNote}

🗓️ **Day-by-Day Itinerary Preview**
Check the interactive **Itinerary Preview** below. You can save this plan to your account or prepare an unconfirmed booking proposal locked with PayPal Escrow protection!`;

    richMetadata.suggestedActions = [
      'Save this Itinerary to Profile',
      'Prepare Booking Proposal',
      'Show Alternative Hotels',
      'Add Water Sports Activities',
    ];

    return reply;
  }
}

export const agentService = new AgentService();
