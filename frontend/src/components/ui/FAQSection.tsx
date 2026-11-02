import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { Badge } from './Badge';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How does PayPal Escrow protection work on WayRivo AI 2.0?',
    answer:
      'When you accept a specialist proposal, your payment is processed securely through PayPal Developer Sandbox and held safely in WayRivo Escrow. The funds are only disbursed to the specialist agency after your journey is completed, ensuring 100% financial security and trip delivery.',
  },
  {
    question: 'How does the Google Gemini AI create bespoke itineraries?',
    answer:
      'Our AI Travel Assistant uses Gemini multimodal tool calling to evaluate destination weather, local route viability, traveler preferences, and budget constraints. It instantly produces a day-by-day structured itinerary and matches your request with certified local travel agencies.',
  },
  {
    question: 'How are travel specialists and agencies verified?',
    answer:
      'Every agency on WayRivo passes strict background and compliance audits, including business licensing verification, minimum 5+ years of verified on-ground regional experience, and customer safety compliance.',
  },
  {
    question: 'Can I request customizations after receiving a proposal?',
    answer:
      'Yes! WayRivo features bidirectional direct messaging. You can chat directly with your assigned specialist to request hotel upgrades, meal plan changes, private transfers, or day itinerary adjustments.',
  },
  {
    question: 'What is the cancellation and refund policy?',
    answer:
      'Each proposal includes a transparent cancellation schedule clearly displayed before booking. Because your deposit remains in escrow, eligible refunds under the agreed policy are processed back to your original payment method without delays.',
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faqs" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14">
        <Badge variant="cyan" size="sm" icon={<HelpCircle className="w-3.5 h-3.5 text-cyan-400" />}>
          Frequently Asked Questions
        </Badge>
        <h2 className="section-title mt-2">Everything You Need to Know</h2>
        <p className="section-subtitle mx-auto">
          Transparent answers about AI planning, verified specialists, and PayPal Escrow protection
        </p>
      </div>

      <div className="space-y-3.5">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              className={`rounded-2xl transition-all duration-200 border ${
                isOpen
                  ? 'bg-surface/95 border-cyan-500/40 shadow-lg shadow-cyan-500/5'
                  : 'bg-surface/60 border-border/80 hover:border-border-light'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
                aria-expanded={isOpen}
              >
                <span className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-cyan-400 transition-transform duration-200 flex-shrink-0 ${
                    isOpen ? 'rotate-180 text-cyan-300' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
