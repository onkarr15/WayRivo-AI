import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Sparkles,
  Send,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Calendar,
  DollarSign,
  MapPin,
} from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';

interface PromptScenario {
  id: string;
  chipLabel: string;
  userPrompt: string;
  aiResponse: string;
  destination: string;
  budget: string;
  days: string;
  toolsCalled: string[];
}

const promptScenarios: PromptScenario[] = [
  {
    id: 'kerala',
    chipLabel: '🌴 Kerala 5-Day Family Retreat (< ₹60K)',
    userPrompt: 'Plan a 5-day Kerala family trip under ₹60,000 with private houseboat in Alleppey and tea plantations in Munnar.',
    aiResponse:
      'Synthesized optimal family itinerary for Kerala: 2 nights tea resort Munnar + 1 night AC deluxe houseboat Alleppey + 1 night heritage Fort Kochi. Budget allocated: ₹55,000 including private Innova cab transfers, daily breakfast & dinner.',
    destination: 'Kerala',
    budget: '55,000',
    days: '5 Days / 4 Nights',
    toolsCalled: ['search_destinations', 'optimize_travel_budget', 'match_specialists'],
  },
  {
    id: 'rajasthan',
    chipLabel: '🏰 Rajasthan Royal Heritage Palace Tour',
    userPrompt: 'Create a romantic 7-day Rajasthan luxury tour covering Jaipur, Jodhpur, and Udaipur lake palace stays.',
    aiResponse:
      'Curated romantic luxury journey across Rajasthan: Amber Fort private heritage walk, desert sunset safari in Jaisalmer, and Lake Pichola boat cruise in Udaipur with 5-star palace accommodation.',
    destination: 'Rajasthan',
    budget: '78,000',
    days: '7 Days / 6 Nights',
    toolsCalled: ['search_destinations', 'generate_smart_itinerary', 'verify_specialist_pricing'],
  },
  {
    id: 'ladakh',
    chipLabel: '🏔️ Ladakh 9-Day High Altitude Expedition',
    userPrompt: 'Adventure Ladakh trip for 4 friends visiting Pangong Lake, Nubra Valley, and Khardung La with comfortable camps.',
    aiResponse:
      'High-altitude adventure synthesized: 2 days acclimatization Leh, Khardung La crossing to Nubra Valley sand dunes, and Swiss lakeside camp Pangong Lake. Inner Line permits & oxygen kits included.',
    destination: 'Ladakh',
    budget: '95,000',
    days: '9 Days / 8 Nights',
    toolsCalled: ['check_travel_requirements', 'generate_smart_itinerary', 'optimize_travel_budget'],
  },
];

export const AIAssistantPromotion: React.FC = () => {
  const navigate = useNavigate();
  const [selectedScenario, setSelectedScenario] = useState<PromptScenario>(promptScenarios[0]);
  const [customInput, setCustomInput] = useState('');

  const handleLaunchPlanner = (scenario: PromptScenario) => {
    navigate(
      `/traveler/create-trip?destination=${encodeURIComponent(scenario.destination)}&budget=${encodeURIComponent(
        scenario.budget.replace(/,/g, '')
      )}`
    );
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      navigate(`/traveler/create-trip?destination=${encodeURIComponent(customInput.trim())}`);
    }
  };

  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-navy-dark via-navy-card to-navy-dark border-y border-border/80">
      {/* Background ambient orbs */}
      <div className="absolute top-1/2 left-1/3 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy & Interactive Prompt Chips */}
          <div className="lg:col-span-5 space-y-6">
            <Badge variant="cyan" size="sm" glow icon={<Bot className="w-3.5 h-3.5 text-cyan-400" />}>
              Google Gemini Powered Agent
            </Badge>

            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Meet Your 24/7 <br />
              <span className="text-gradient-cyan">AI Travel Agent</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              No generic chatbot. WayRivo AI orchestrates actual backend tools: checking live specialist availability, balancing hotel vs flight budgets, generating day-by-day routes, and locking your booking with PayPal escrow.
            </p>

            {/* Interactive Prompt Scenarios */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Try interactive AI scenarios:
              </p>
              <div className="flex flex-col gap-2">
                {promptScenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => setSelectedScenario(scenario)}
                    className={`text-left text-xs font-semibold p-3 rounded-2xl border transition-all cursor-pointer ${
                      selectedScenario.id === scenario.id
                        ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/15'
                        : 'bg-surface border-border-light text-slate-400 hover:text-white hover:bg-surface-elevated'
                    }`}
                  >
                    {scenario.chipLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Launch Action */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => handleLaunchPlanner(selectedScenario)}
                className="w-full sm:w-auto px-7 shadow-cyan-500/25"
              >
                Launch AI Planner for {selectedScenario.destination}
              </Button>
            </div>
          </div>

          {/* Right Column: Live Simulated Chat & Tool Execution Window */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl bg-surface border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 overflow-hidden">
              {/* Window Title Bar */}
              <div className="px-5 py-3.5 bg-navy-dark/90 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-bold text-slate-300">
                    WayRivo Gemini Agent &bull; v2.0
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Agent Online
                  </span>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="p-6 space-y-5 min-h-[360px] bg-navy-card/60">
                {/* User Prompt Message */}
                <div className="flex items-start gap-3 justify-end">
                  <div className="max-w-md p-4 rounded-2xl rounded-tr-sm bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs sm:text-sm shadow-md">
                    {selectedScenario.userPrompt}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-black text-xs flex-shrink-0">
                    You
                  </div>
                </div>

                {/* AI Reasoning & Tool Execution Badges */}
                <div className="flex flex-col gap-1.5 max-w-md">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-cyan-400" /> Tool Calling & Execution Ledger:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedScenario.toolsCalled.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/5 border border-cyan-500/30 text-cyan-300 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                        {tool}()
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI Response Card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedScenario.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-cyan-400" />
                    </div>

                    <div className="space-y-3 max-w-xl">
                      <div className="p-4 rounded-2xl rounded-tl-sm bg-surface-elevated border border-border-light text-slate-200 text-xs sm:text-sm leading-relaxed">
                        {selectedScenario.aiResponse}
                      </div>

                      {/* Itinerary Micro-Preview Badge */}
                      <div className="p-3.5 rounded-2xl bg-surface-dark border border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Destination</span>
                          <span className="font-bold text-white mt-0.5 flex items-center justify-center gap-1">
                            <MapPin className="w-3 h-3 text-cyan-400" /> {selectedScenario.destination}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Duration</span>
                          <span className="font-bold text-white mt-0.5 flex items-center justify-center gap-1">
                            <Calendar className="w-3 h-3 text-teal-400" /> {selectedScenario.days}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Est. Budget</span>
                          <span className="font-bold text-cyan-300 mt-0.5 flex items-center justify-center gap-1">
                            <DollarSign className="w-3 h-3 text-amber-400" /> ₹{selectedScenario.budget}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={handleCustomSubmit}
                className="p-3 bg-surface-elevated border-t border-border/80 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Ask WayRivo AI anything... (e.g. 4 days in Goa with beach cottages)"
                  className="flex-1 bg-surface-dark px-4 py-2.5 rounded-xl border border-white/10 text-white placeholder:text-slate-500 text-xs sm:text-sm outline-none focus:border-cyan-400"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  className="px-4"
                >
                  Send
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
