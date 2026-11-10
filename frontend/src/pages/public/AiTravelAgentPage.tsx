import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  Sparkles,
  Plus,
  MessageSquare,
  Trash2,
  ShieldCheck,
  Zap,
  ChevronRight,
  Compass,
} from 'lucide-react';
import { aiAgentService } from '../../services';
import { useToast } from '../../components/ui/Toast';
import { DestinationRecommendationCard } from '../../components/agent/DestinationRecommendationCard';
import { HotelRecommendationCard } from '../../components/agent/HotelRecommendationCard';
import { ActivityRecommendationCard } from '../../components/agent/ActivityRecommendationCard';
import { BudgetSummaryCard } from '../../components/agent/BudgetSummaryCard';
import { ItineraryPreviewCard } from '../../components/agent/ItineraryPreviewCard';
import { EditItineraryModal } from '../../components/agent/EditItineraryModal';
import { BookingProposalModal } from '../../components/agent/BookingProposalModal';
import { staggerContainer, staggerItem } from '../../utils/animations';

interface MessageItem {
  id: string;
  sender: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  metadata?: any;
  createdAt?: string;
  isStreaming?: boolean;
}

interface ConversationItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const parseBoldAndItalic = (text: string): React.ReactNode[] => {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return (
        <em key={i} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
};

const renderInlineFormatting = (text: string) => {
  // Strip any leading # from headers if present
  const cleaned = text.replace(/^#{1,6}\s*/, '');

  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...parseBoldAndItalic(cleaned.substring(lastIndex, match.index)));
    }
    const linkText = match[1];
    const linkUrl = match[2];

    if (linkUrl.startsWith('file://')) {
      // Do not display raw file paths, render as clean bold text
      parts.push(
        <strong key={`link-${match.index}`} className="font-bold text-white">
          {linkText}
        </strong>
      );
    } else {
      parts.push(
        <a
          key={`link-${match.index}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 underline hover:text-cyan-300 font-semibold"
        >
          {linkText}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < cleaned.length) {
    parts.push(...parseBoldAndItalic(cleaned.substring(lastIndex)));
  }

  return parts;
};

const renderFormattedMessage = (content: string, isUser: boolean, isStreaming?: boolean) => {
  if (!content) {
    if (isStreaming) {
      return (
        <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse rounded-xs align-middle shadow-[0_0_8px_rgba(0,242,254,0.6)]" />
      );
    }
    return null;
  }

  // Split into lines
  const lines = content.split('\n');

  return (
    <div className={`space-y-1.5 ${isUser ? 'text-white' : 'text-slate-200'}`}>
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();

        if (!line) {
          return <div key={idx} className="h-1" />;
        }

        const isLastLine = idx === lines.length - 1;

        // Header line with hashtags (e.g. ### 🌟 Title, #### 📍 Destination) -> Strip hashtags and style as clean heading
        const headerMatch = line.match(/^#{1,6}\s*(.*)$/);
        if (headerMatch) {
          const headerText = headerMatch[1].trim();
          const isMain = line.startsWith('#') && (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### '));
          return (
            <div
              key={idx}
              className={`${
                isMain
                  ? 'text-sm sm:text-base font-extrabold text-white tracking-tight pt-1 pb-0.5 border-b border-white/10'
                  : 'text-xs sm:text-sm font-bold text-cyan-300 pt-2 pb-0.5'
              }`}
            >
              {renderInlineFormatting(headerText)}
              {isLastLine && isStreaming && (
                <span className="inline-block w-1.5 h-3.5 ml-1.5 bg-cyan-400 animate-pulse rounded-xs align-middle shadow-[0_0_8px_rgba(0,242,254,0.6)]" />
              )}
            </div>
          );
        }

        // Bullet point line (- or • or * followed by space)
        const bulletMatch = line.match(/^[-•*]\s+(.*)$/);
        if (bulletMatch && !line.startsWith('**')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-cyan-400 font-bold leading-tight select-none">•</span>
              <span className="flex-1">
                {renderInlineFormatting(bulletMatch[1])}
                {isLastLine && isStreaming && (
                  <span className="inline-block w-1.5 h-3.5 ml-1.5 bg-cyan-400 animate-pulse rounded-xs align-middle shadow-[0_0_8px_rgba(0,242,254,0.6)]" />
                )}
              </span>
            </div>
          );
        }

        // Regular line
        return (
          <p key={idx} className="leading-relaxed">
            {renderInlineFormatting(line)}
            {isLastLine && isStreaming && (
              <span className="inline-block w-1.5 h-3.5 ml-1.5 bg-cyan-400 animate-pulse rounded-xs align-middle shadow-[0_0_8px_rgba(0,242,254,0.6)]" />
            )}
          </p>
        );
      })}
    </div>
  );
};

export const AiTravelAgentPage: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [typingStatus, setTypingStatus] = useState<string>('');
  const [suggestedPrompts, setSuggestedPrompts] = useState<any[]>([]);

  // Modals
  const [editingItinerary, setEditingItinerary] = useState<any | null>(null);
  const [proposalModal, setProposalModal] = useState<any | null>(null);
  const [savedItineraryIds, setSavedItineraryIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamingIntervalRef = useRef<any>(null);

  // Clean up streaming interval on unmount
  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  // Load Suggested Prompts & Conversations
  useEffect(() => {
    aiAgentService
      .getSuggestedPrompts()
      .then((res) => {
        if (res.data?.data) setSuggestedPrompts(res.data.data);
      })
      .catch(() => {});

    loadConversations();
  }, []);

  const loadConversations = () => {
    aiAgentService
      .getConversations()
      .then((res: any) => {
        if (res.data?.data) {
          setConversations(res.data.data);
          // If query param has conversationId, open it
          const initialId = searchParams.get('conversationId');
          if (initialId) {
            setActiveConversationId(initialId);
          }
        }
      })
      .catch(() => {});
  };

  // Load Conversation messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      aiAgentService
        .getConversation(activeConversationId)
        .then((res) => {
          if (res.data?.data?.messages) {
            setMessages(res.data.data.messages);
          }
        })
        .catch(() => {
          setActiveConversationId(null);
        });
    } else {
      setMessages([]);
    }
  }, [activeConversationId]);

  // Handle Initial Prompt from Query Params
  useEffect(() => {
    const initialPrompt = searchParams.get('prompt');
    if (initialPrompt && messages.length === 0 && !loading) {
      handleSendMessage(initialPrompt);
      // Clean query param
      searchParams.delete('prompt');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  // Start New Conversation
  const handleNewConversation = () => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    setActiveConversationId(null);
    setMessages([]);
    setInputMessage('');
    searchParams.delete('conversationId');
    setSearchParams(searchParams);
    inputRef.current?.focus();
  };

  // Delete Conversation
  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await aiAgentService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewConversation();
      }
      toast.success('Conversation removed.');
    } catch {
      toast.error('Failed to remove conversation.');
    }
  };

  // Send Message with Slow, Deliberate Progressive Output Generation
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || loading) return;

    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }

    setInputMessage('');

    // Append optimistic user message
    const tempUserMsg: MessageItem = {
      id: `temp-${Date.now()}`,
      sender: 'USER',
      content: query,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    setLoading(true);
    setTypingStatus('Analyzing your travel preferences & requirements...');

    const t1 = setTimeout(() => {
      setTypingStatus('Querying live database inventory & verified hotels...');
    }, 700);

    const t2 = setTimeout(() => {
      setTypingStatus('Calculating budget expenditure & structuring itinerary...');
    }, 1600);

    try {
      const res = await aiAgentService.chat(query, activeConversationId || undefined);

      clearTimeout(t1);
      clearTimeout(t2);

      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        if (data.conversationId && data.conversationId !== activeConversationId) {
          setActiveConversationId(data.conversationId);
          loadConversations();
        }

        const fullReply = data.reply || '';
        const assistantMsgId = data.messageId || `asst-${Date.now()}`;
        const finalMetadata = {
          toolsExecuted: data.toolsExecuted || data.metadata?.toolsExecuted,
          destinations: data.destinations || data.metadata?.destinations,
          hotels: data.hotels || data.metadata?.hotels,
          activities: data.activities || data.metadata?.activities,
          packages: data.packages || data.metadata?.packages,
          budgetAnalysis: data.budgetAnalysis || data.metadata?.budgetAnalysis,
          itinerary: data.itinerary || data.metadata?.itinerary,
          suggestedActions: data.suggestedActions || data.metadata?.suggestedActions,
          savedItineraryId: data.savedItineraryId || data.metadata?.savedItineraryId,
        };

        // Initialize streaming assistant message with empty content and typing state
        const initialAssistantMsg: MessageItem = {
          id: assistantMsgId,
          sender: 'ASSISTANT',
          content: '',
          metadata: null, // Defer cards until typing completes
          isStreaming: true,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, initialAssistantMsg]);
        setTypingStatus('');

        // Progressively stream words at a natural, readable speed (slow & steady)
        const words = fullReply.split(/(\s+)/);
        let currentIndex = 0;
        // Pacing: 1 word chunk per tick (or 2 if very lengthy)
        const step = words.length > 280 ? 2 : 1;

        streamingIntervalRef.current = setInterval(() => {
          currentIndex += step;
          if (currentIndex >= words.length) {
            if (streamingIntervalRef.current) {
              clearInterval(streamingIntervalRef.current);
              streamingIntervalRef.current = null;
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: fullReply,
                      metadata: finalMetadata,
                      isStreaming: false,
                    }
                  : m
              )
            );
            setLoading(false);
            setTypingStatus('');
          } else {
            const partialText = words.slice(0, currentIndex).join('');
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                      ...m,
                      content: partialText,
                      isStreaming: true,
                    }
                  : m
              )
            );
          }
        }, 32); // 32ms produces deliberate, smooth progressive typing without rushing
      } else {
        toast.error(res.data?.error || 'Failed to get a response from AI agent.');
        setLoading(false);
        setTypingStatus('');
      }
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      toast.error(err.response?.data?.error || 'Network error communicating with AI agent.');
      setLoading(false);
      setTypingStatus('');
    }
  };

  // Save Itinerary to User Profile
  const handleSaveItinerary = async (itinerary: any) => {
    try {
      const res = await aiAgentService.saveItinerary({
        destinationId: itinerary.destinationId || itinerary.destination?.id,
        title: itinerary.title || `${itinerary.numberOfDays || 5}-Day ${itinerary.destinationName || 'Travel'} Itinerary`,
        numberOfDays: itinerary.numberOfDays || 5,
        totalCost: itinerary.totalCost || itinerary.budget?.totalCalculatedCost || 25000,
        itineraryData: itinerary,
      });

      if (res.data?.data?.itineraryId) {
        setSavedItineraryIds((prev) => new Set(prev).add(res.data.data.itineraryId));
        toast.success('Itinerary saved to your WayRivo profile!');
      } else {
        toast.success('Itinerary plan saved successfully!');
      }
    } catch {
      toast.error('Failed to save itinerary. Please check your connection.');
    }
  };

  // Prepare Booking Proposal
  const handlePrepareBooking = async (itinerary: any) => {
    try {
      const res = await aiAgentService.createProposal({
        itineraryId: itinerary.id,
        hotelId: itinerary.hotel?.id,
        requestedNights: Math.max(1, (itinerary.numberOfDays || 5) - 1),
        travelersCount: itinerary.travelersCount || 2,
        specialRequests: `Crafted from ${itinerary.numberOfDays}-Day ${itinerary.destinationName} AI Travel Plan.`,
      });

      if (res.data?.data) {
        setProposalModal(res.data.data);
      }
    } catch {
      toast.error('Unable to generate proposal. Please try again.');
    }
  };

  // Handle Edit Itinerary save
  const handleSaveModifiedItinerary = (modified: any) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.metadata?.itinerary) {
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              itinerary: modified,
            },
          };
        }
        return msg;
      })
    );
    toast.success('Modified itinerary updated in current session!');
  };

  return (
    <div className="min-h-screen bg-navy-dark pt-20 pb-10 flex flex-col">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
        {/* Top Agent Status Banner */}
        <div className="mb-4 p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-xl shadow-cyan-950/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-cyan-500/30">
                <Bot className="w-6 h-6" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white">WayRivo AI 2.0 Autonomous Travel Agent</h1>
              </div>
              <p className="text-xs text-slate-400">
                Natural-language planning, real database inventory verification, and deterministic budget optimization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewConversation}
              className="py-1.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Session</span>
            </button>
          </div>
        </div>

        {/* Main Agent Workspace: Sidebar + Chat Thread */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-[600px]">
          {/* Left Column: Conversation History Sidebar */}
          <div className="hidden lg:flex flex-col rounded-3xl bg-slate-900/50 border border-white/5 backdrop-blur-xl p-4 overflow-hidden">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Planning Sessions</span>
              <button
                onClick={handleNewConversation}
                className="p-1 rounded-lg hover:bg-white/5 text-cyan-400 transition-colors cursor-pointer"
                title="New Session"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {conversations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  No previous sessions
                </div>
              ) : (
                conversations.map((c) => {
                  const isActive = activeConversationId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setActiveConversationId(c.id)}
                      className={`group p-2.5 rounded-xl text-left text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">{c.title}</span>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(e, c.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-opacity cursor-pointer"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* AI Capabilities Footnote */}
            <div className="pt-3 mt-auto border-t border-white/5 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Source of Truth: Verified DB</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                All prices, star tiers, and slot availability are strictly retrieved from real live PostgreSQL records.
              </p>
            </div>
          </div>

          {/* Right Column: Chat Stream & Message Thread */}
          <div className="lg:col-span-3 flex flex-col rounded-3xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-xl overflow-hidden shadow-2xl shadow-cyan-950/20">
            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5">
              {messages.length === 0 ? (
                /* Welcome / Empty State with Suggested Prompts */
                <div className="py-8 sm:py-12 max-w-2xl mx-auto text-center space-y-6">
                  <div className="inline-flex p-4 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-teal-500/10 to-transparent border border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
                    <Sparkles className="w-10 h-10 text-cyan-400" />
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">
                      Where would you like to travel next?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-lg mx-auto">
                      Describe your dream trip in plain language. WayRivo AI automatically queries live destinations,
                      verified hotels, curated excursions, and builds a personalized day-by-day itinerary with exact budget math.
                    </p>
                  </div>

                  {/* Suggested Prompts Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
                    {suggestedPrompts.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(p.query)}
                        className="p-3.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/40 text-left transition-all duration-300 group cursor-pointer"
                      >
                        <div className="flex items-center justify-between text-[10px] font-bold text-cyan-400 mb-1">
                          <span>{p.category}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {p.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                          "{p.query}"
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Message Thread with Fluid Entrance Animations */
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const isUser = msg.sender === 'USER';
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 14, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isUser && (
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 shrink-0 mt-1 shadow-md shadow-cyan-500/20">
                            <Bot className="w-4 h-4 font-black" />
                          </div>
                        )}

                        <div className={`max-w-2xl space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
                          {/* Message Bubble */}
                          <div
                            className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                              isUser
                                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-tr-none shadow-lg shadow-cyan-600/20'
                                : 'bg-slate-800/80 border border-white/10 text-slate-100 rounded-tl-none shadow-md'
                            }`}
                          >
                            <div>
                              {renderFormattedMessage(msg.content, isUser, msg.isStreaming)}
                            </div>

                            {/* Tool Execution Badges */}
                            {msg.metadata?.toolsExecuted && msg.metadata.toolsExecuted.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3 pt-2.5 border-t border-white/10 text-[10px]">
                                {msg.metadata.toolsExecuted.map((t: any, i: number) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 font-mono text-[9px]"
                                  >
                                    <Zap className="w-2.5 h-2.5 text-cyan-400" />
                                    <span>{t.tool}()</span>
                                    <span className="text-slate-400">({t.latencyMs}ms)</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Interactive Recommendation Cards with Staggered Entrance */}
                          {!isUser && msg.metadata && !msg.isStreaming && (
                            <motion.div
                              variants={staggerContainer}
                              initial="hidden"
                              animate="visible"
                              className="space-y-3 w-full"
                            >
                              {/* Destination Card */}
                              {msg.metadata.destinations && msg.metadata.destinations.length > 0 && (
                                <motion.div variants={staggerItem}>
                                  <DestinationRecommendationCard
                                    destination={msg.metadata.destinations[0]}
                                  />
                                </motion.div>
                              )}

                              {/* Budget Summary Card */}
                              {msg.metadata.budgetAnalysis && (
                                <motion.div variants={staggerItem}>
                                  <BudgetSummaryCard budget={msg.metadata.budgetAnalysis} />
                                </motion.div>
                              )}

                              {/* Itinerary Preview Card */}
                              {msg.metadata.itinerary && (
                                <motion.div variants={staggerItem}>
                                  <ItineraryPreviewCard
                                    itinerary={msg.metadata.itinerary}
                                    onSave={handleSaveItinerary}
                                    onEdit={(itin) => setEditingItinerary(itin)}
                                    onPrepareBooking={handlePrepareBooking}
                                    isSaved={savedItineraryIds.has(msg.metadata.savedItineraryId)}
                                  />
                                </motion.div>
                              )}

                              {/* Hotel Cards List */}
                              {msg.metadata.hotels && msg.metadata.hotels.length > 0 && (
                                <motion.div variants={staggerItem}>
                                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                                    <span>Verified Accommodations in Inventory</span>
                                  </h5>
                                  {msg.metadata.hotels.slice(0, 2).map((h: any) => (
                                    <HotelRecommendationCard key={h.id} hotel={h} />
                                  ))}
                                </motion.div>
                              )}

                              {/* Activity Cards List */}
                              {msg.metadata.activities && msg.metadata.activities.length > 0 && (
                                <motion.div variants={staggerItem}>
                                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                                    <span>Curated Excursions & Adventures</span>
                                  </h5>
                                  {msg.metadata.activities.slice(0, 2).map((a: any) => (
                                    <ActivityRecommendationCard key={a.id} activity={a} />
                                  ))}
                                </motion.div>
                              )}

                              {/* Suggested Follow-up Actions */}
                              {msg.metadata.suggestedActions && msg.metadata.suggestedActions.length > 0 && (
                                <motion.div variants={staggerItem} className="flex flex-wrap gap-1.5 pt-1">
                                  {msg.metadata.suggestedActions.map((act: string, idx: number) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleSendMessage(act)}
                                      className="py-1 px-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-cyan-500/20 text-[11px] font-semibold transition-all cursor-pointer"
                                    >
                                      {act}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}

              {/* Dynamic Typing Indicator with Animated Pulsing Dots */}
              <AnimatePresence>
                {loading && typingStatus && !messages.some((m) => m.isStreaming) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 shrink-0">
                      <Bot className="w-4 h-4 font-black" />
                    </div>
                    <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-800/80 border border-white/10 flex items-center gap-3 text-xs text-slate-300">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map((dot) => (
                          <motion.span
                            key={dot}
                            animate={{ y: [-3, 3, -3], opacity: [0.35, 1, 0.35] }}
                            transition={{
                              duration: 0.8,
                              repeat: Infinity,
                              delay: dot * 0.16,
                              ease: 'easeInOut',
                            }}
                            className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block"
                          />
                        ))}
                      </div>
                      <span className="font-medium text-cyan-200">{typingStatus || 'Consulting live database tools...'}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 bg-slate-950/80 border-t border-white/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask WayRivo AI (e.g. 'Plan a 5-day Goa trip for two under ₹25,000 with beaches & good hotels')..."
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs sm:text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 outline-none transition-all"
                />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </form>

              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 px-1">
                <span>WayRivo AI 2.0 • Autonomous Tools Grounded in Real Inventory</span>
                <span>Press Enter to send</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <EditItineraryModal
        itinerary={editingItinerary}
        isOpen={Boolean(editingItinerary)}
        onClose={() => setEditingItinerary(null)}
        onSaveModified={handleSaveModifiedItinerary}
      />

      <BookingProposalModal
        proposal={proposalModal}
        isOpen={Boolean(proposalModal)}
        onClose={() => setProposalModal(null)}
      />
    </div>
  );
};

export default AiTravelAgentPage;
