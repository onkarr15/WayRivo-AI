import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Bot,
  Send,
  Sparkles,
  Plus,
  MessageSquare,
  Trash2,
  ShieldCheck,
  Loader2,
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

interface MessageItem {
  id: string;
  sender: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  metadata?: any;
  createdAt?: string;
}

interface ConversationItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export const AiTravelAgentPage: React.FC = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    searchParams.get('session') || null
  );
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [typingStatus, setTypingStatus] = useState<string | null>(null);
  const [suggestedPrompts, setSuggestedPrompts] = useState<any[]>([]);

  // Modals
  const [editingItinerary, setEditingItinerary] = useState<any>(null);
  const [proposalModal, setProposalModal] = useState<any>(null);
  const [savedItineraryIds, setSavedItineraryIds] = useState<Set<string>>(new Set());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadConversations = React.useCallback(async () => {
    try {
      const res = await aiAgentService.getConversations();
      if (Array.isArray(res.data?.data)) {
        setConversations(res.data.data);
      }
    } catch {
      // Ignore for guest sessions
    }
  }, []);

  // Auto-scroll to bottom of thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingStatus]);

  // Load Suggested Prompts & Conversations
  useEffect(() => {
    aiAgentService
      .getSuggestedPrompts()
      .then((res) => {
        if (res.data?.data) setSuggestedPrompts(res.data.data);
      })
      .catch(() => {});

    loadConversations();
  }, [loadConversations]);

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

  // Start a new conversation
  const handleNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setSearchParams({});
    inputRef.current?.focus();
  };

  // Delete / Archive Conversation
  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await aiAgentService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewConversation();
      }
      toast.success('Session removed');
    } catch {
      toast.error('Failed to remove conversation');
    }
  };

  // Send Message Handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    setInputMessage('');

    // Append optimistic user message
    const tempUserMsg: MessageItem = {
      id: `temp-${Date.now()}`,
      sender: 'USER',
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);
    setTypingStatus('WayRivo AI is analyzing your travel requirements...');

    try {
      const res = await aiAgentService.chat(text, activeConversationId || undefined);
      const data = res.data?.data;

      if (data) {
        if (!activeConversationId && data.conversationId) {
          setActiveConversationId(data.conversationId);
          setSearchParams({ session: data.conversationId });
          loadConversations();
        }

        const assistantMsg: MessageItem = {
          id: data.messageId || `asst-${Date.now()}`,
          sender: 'ASSISTANT',
          content: data.reply,
          metadata: data.metadata,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      toast.error('AI Agent encountered an issue. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'ASSISTANT',
          content: '⚠️ I encountered a temporary network issue. Please re-send your message.',
        },
      ]);
    } finally {
      setLoading(false);
      setTypingStatus(null);
    }
  };

  // Save Itinerary to user account
  const handleSaveItinerary = async (itinerary: any) => {
    try {
      const res = await aiAgentService.saveItinerary({
        title: itinerary.title || `${itinerary.destinationName} Travel Plan`,
        destinationName: itinerary.destinationName,
        destinationId: itinerary.destinationId,
        numberOfDays: itinerary.numberOfDays,
        travelersCount: itinerary.travelersCount,
        budget: itinerary.totalEstimatedCost,
        travelStyle: itinerary.travelStyle,
        days: itinerary.days,
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
    // Update local message metadata
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
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Google Gemini + Live Supabase
                </span>
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
                /* Message Thread */
                messages.map((msg) => {
                  const isUser = msg.sender === 'USER';
                  return (
                    <div
                      key={msg.id}
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
                          <div className="prose prose-invert max-w-none whitespace-pre-line">
                            {msg.content}
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

                        {/* Interactive Cards Attached to Agent Reply */}
                        {!isUser && msg.metadata && (
                          <div className="space-y-3 w-full">
                            {/* Destination Card */}
                            {msg.metadata.destinations && msg.metadata.destinations.length > 0 && (
                              <DestinationRecommendationCard
                                destination={msg.metadata.destinations[0]}
                              />
                            )}

                            {/* Budget Summary Card */}
                            {msg.metadata.budgetAnalysis && (
                              <BudgetSummaryCard budget={msg.metadata.budgetAnalysis} />
                            )}

                            {/* Itinerary Preview Card */}
                            {msg.metadata.itinerary && (
                              <ItineraryPreviewCard
                                itinerary={msg.metadata.itinerary}
                                onSave={handleSaveItinerary}
                                onEdit={(itin) => setEditingItinerary(itin)}
                                onPrepareBooking={handlePrepareBooking}
                                isSaved={savedItineraryIds.has(msg.metadata.savedItineraryId)}
                              />
                            )}

                            {/* Hotel Cards Carousel / List */}
                            {msg.metadata.hotels && msg.metadata.hotels.length > 0 && (
                              <div>
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                                  <span>Verified Accommodations in Inventory</span>
                                </h5>
                                {msg.metadata.hotels.slice(0, 2).map((h: any) => (
                                  <HotelRecommendationCard key={h.id} hotel={h} />
                                ))}
                              </div>
                            )}

                            {/* Activity Cards List */}
                            {msg.metadata.activities && msg.metadata.activities.length > 0 && (
                              <div>
                                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                                  <span>Curated Excursions & Adventures</span>
                                </h5>
                                {msg.metadata.activities.slice(0, 2).map((a: any) => (
                                  <ActivityRecommendationCard key={a.id} activity={a} />
                                ))}
                              </div>
                            )}

                            {/* Suggested Follow-up Actions */}
                            {msg.metadata.suggestedActions && msg.metadata.suggestedActions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {msg.metadata.suggestedActions.map((act: string, idx: number) => (
                                  <button
                                    key={idx}
                                    onClick={() => handleSendMessage(act)}
                                    className="py-1 px-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-cyan-300 border border-cyan-500/20 text-[11px] font-semibold transition-all cursor-pointer"
                                  >
                                    {act}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Dynamic Typing & Tool Execution Indicator */}
              {loading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-slate-950 shrink-0">
                    <Bot className="w-4 h-4 font-black" />
                  </div>
                  <div className="p-3.5 rounded-2xl rounded-tl-none bg-slate-800/80 border border-white/10 flex items-center gap-2.5 text-xs text-slate-300">
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                    <span>{typingStatus || 'Consulting live database tools...'}</span>
                  </div>
                </div>
              )}

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

                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/25 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
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
