import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Lock,
  Eye,
  Server,
  Bot,
  CreditCard,
  UserCheck,
  FileText,
  Mail,
  Phone,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  Globe,
  Database,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Section {
  id: string;
  title: string;
  shortTitle: string;
  icon: React.ReactNode;
}

const sections: Section[] = [
  { id: 'introduction', title: '1. Introduction', shortTitle: 'Introduction', icon: <FileText className="w-4 h-4" /> },
  { id: 'information-we-collect', title: '2. Information We Collect', shortTitle: 'Information We Collect', icon: <Eye className="w-4 h-4" /> },
  { id: 'personal-information', title: '3. Personal Information', shortTitle: 'Personal Information', icon: <UserCheck className="w-4 h-4" /> },
  { id: 'account-and-authentication', title: '4. Account and Authentication Information', shortTitle: 'Authentication & Accounts', icon: <Lock className="w-4 h-4" /> },
  { id: 'travel-and-booking-information', title: '5. Travel and Booking Information', shortTitle: 'Travel & Bookings', icon: <Globe className="w-4 h-4" /> },
  { id: 'payment-information', title: '6. Payment Information', shortTitle: 'Payment Data', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'ai-powered-services-and-gemini', title: '7. AI-Powered Services and Gemini Integration', shortTitle: 'AI & Gemini Services', icon: <Bot className="w-4 h-4" /> },
  { id: 'cookies-and-similar-technologies', title: '8. Cookies and Similar Technologies', shortTitle: 'Cookies & Storage', icon: <FileText className="w-4 h-4" /> },
  { id: 'how-we-use-your-information', title: '9. How We Use Your Information', shortTitle: 'How We Use Data', icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'how-we-share-your-information', title: '10. How We Share Your Information', shortTitle: 'Data Sharing', icon: <Globe className="w-4 h-4" /> },
  { id: 'third-party-services', title: '11. Third-Party Services', shortTitle: 'Third-Party Services', icon: <Server className="w-4 h-4" /> },
  { id: 'paypal-payment-processing', title: '12. PayPal Payment Processing', shortTitle: 'PayPal Processing', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'supabase-database-and-storage', title: '13. Supabase Database and Data Storage', shortTitle: 'Database & Storage', icon: <Database className="w-4 h-4" /> },
  { id: 'data-security', title: '14. Data Security', shortTitle: 'Data Security', icon: <Shield className="w-4 h-4" /> },
  { id: 'data-retention', title: '15. Data Retention', shortTitle: 'Data Retention', icon: <Clock className="w-4 h-4" /> },
  { id: 'user-rights-and-data-access', title: '16. User Rights and Data Access', shortTitle: 'User Rights', icon: <UserCheck className="w-4 h-4" /> },
  { id: 'account-deletion', title: '17. Account Deletion', shortTitle: 'Account Deletion', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'childrens-privacy', title: '18. Children’s Privacy', shortTitle: 'Children’s Privacy', icon: <Shield className="w-4 h-4" /> },
  { id: 'international-data-transfers', title: '19. International Data Transfers', shortTitle: 'International Transfers', icon: <Globe className="w-4 h-4" /> },
  { id: 'changes-to-this-privacy-policy', title: '20. Changes to This Privacy Policy', shortTitle: 'Policy Changes', icon: <Clock className="w-4 h-4" /> },
  { id: 'contact-information', title: '21. Contact Information', shortTitle: 'Contact Us', icon: <Mail className="w-4 h-4" /> },
];

const PrivacyPolicyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('introduction');
  const [isMobileTocOpen, setIsMobileTocOpen] = useState<boolean>(false);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  // Set document title and SEO meta description
  useEffect(() => {
    document.title = 'Privacy Policy | WayRivo AI';
    const metaDescription = document.querySelector('meta[name="description"]');
    const originalContent = metaDescription?.getAttribute('content') || '';
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Learn how WayRivo AI collects, uses, processes and protects your personal information when using our travel planning and booking platform.'
      );
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content =
        'Learn how WayRivo AI collects, uses, processes and protects your personal information when using our travel planning and booking platform.';
      document.head.appendChild(meta);
    }

    return () => {
      if (metaDescription && originalContent) {
        metaDescription.setAttribute('content', originalContent);
      }
    };
  }, []);

  // Track scroll position to update active TOC section and Back-to-Top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);

      const headerOffset = 140;
      let currentSection = sections[0].id;

      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= headerOffset) {
            currentSection = section.id;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsMobileTocOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-navy-dark text-slate-100">
      {/* Hero Header */}
      <header className="relative border-b border-border/80 bg-gradient-to-b from-surface/60 via-navy-dark to-navy-dark overflow-hidden py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        {/* Glow Highlights */}
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs font-semibold text-cyan-400 mb-4">
            <Shield className="w-3.5 h-3.5" /> LEGAL & PRIVACY TRUST CENTER
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            WayRivo AI Privacy Policy
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Learn how WayRivo AI collects, uses, processes, and protects your personal information when using our autonomous travel planning and escrow marketplace.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-lg border border-border">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Last Updated: November 6, 2026</span>
            </span>
            <span className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-lg border border-border">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Version 2.0 &bull; Platform Specification Grounded</span>
            </span>
            <span className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-lg border border-border">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zero Selling of User Data</span>
            </span>
          </div>

          {/* Key Assurance Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 text-left">
            <div className="p-3.5 rounded-xl bg-surface/70 border border-border/80">
              <CreditCard className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="text-xs font-bold text-white block">No Card Stored</span>
              <span className="text-[11px] text-slate-400">Payments routed through PayPal Orders v2</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface/70 border border-border/80">
              <Database className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-xs font-bold text-white block">Supabase Storage</span>
              <span className="text-[11px] text-slate-400">PostgreSQL with Row-Level Security</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface/70 border border-border/80">
              <Bot className="w-4 h-4 text-cyan-400 mb-1" />
              <span className="text-xs font-bold text-white block">Google Gemini AI</span>
              <span className="text-[11px] text-slate-400">Itineraries generated via secure API</span>
            </div>
            <div className="p-3.5 rounded-xl bg-surface/70 border border-border/80">
              <Shield className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-xs font-bold text-white block">Escrow Protected</span>
              <span className="text-[11px] text-slate-400">Funds locked until journey delivery</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mobile Table of Contents Accordion */}
        <div className="lg:hidden mb-8">
          <div className="bg-surface rounded-2xl border border-border shadow-sm p-4">
            <button
              type="button"
              onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
              className="w-full flex items-center justify-between text-left text-sm font-bold text-white"
              aria-expanded={isMobileTocOpen}
            >
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Table of Contents ({sections.length} Sections)</span>
              </span>
              {isMobileTocOpen ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {isMobileTocOpen && (
              <nav aria-label="Mobile table of contents" className="mt-4 pt-3 border-t border-border space-y-1.5 max-h-80 overflow-y-auto pr-1">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollToSection(s.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all ${
                      activeSection === s.id
                        ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-surface-elevated hover:text-white'
                    }`}
                  >
                    <span className="text-cyan-400 flex-shrink-0">{s.icon}</span>
                    <span className="truncate">{s.title}</span>
                  </button>
                ))}
              </nav>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Table of Contents Sidebar */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-28">
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" /> Table of Contents
                </h2>
                <span className="text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 font-semibold">
                  21 Sections
                </span>
              </div>

              <nav aria-label="Table of contents" className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
                {sections.map((s) => {
                  const isActive = activeSection === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => scrollToSection(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-center gap-2.5 cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/10 text-cyan-300 font-bold border border-cyan-500/30 shadow-xs'
                          : 'text-slate-400 hover:text-white hover:bg-surface-elevated'
                      }`}
                    >
                      <span className={`flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                        {s.icon}
                      </span>
                      <span className="truncate">{s.title}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-border">
                <Link
                  to="/"
                  className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors font-medium"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to WayRivo Home
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Legal Content */}
          <main className="lg:col-span-8 space-y-10">
            {/* Legal Notice Callout */}
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-200 leading-relaxed flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-0.5">Platform Transparency Notice</p>
                <p>
                  This Privacy Policy provides a factual, genuine disclosure of the technical data flows, database schemas, AI model integrations, and payment protocols implemented within WayRivo AI 2.0. This policy is maintained in alignment with applicable privacy regulations and is subject to periodic legal compliance review.
                </p>
              </div>
            </div>

            {/* SECTION 1: Introduction */}
            <section id="introduction" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">1</span>
                Introduction
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  Welcome to <strong className="text-white">WayRivo AI 2.0</strong> (&ldquo;WayRivo&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), an autonomous travel planning and reverse-marketplace platform. WayRivo connects travelers with certified local destination specialists, generates AI-powered tailored itineraries, and secures bookings through escrow-backed transactions.
                </p>
                <p>
                  This Privacy Policy describes our practices regarding the collection, storage, processing, transfer, and disclosure of personal and trip-related data when you access or use the WayRivo web application (accessible via <code className="text-cyan-300 bg-surface px-1.5 py-0.5 rounded text-xs">wayrivo.com</code> or local host development ports), our APIs, or any related services.
                </p>
                <p>
                  By creating an account, browsing open proposals, submitting trip requests, or executing escrow-protected bookings on WayRivo, you acknowledge that you have read and understood the practices described herein.
                </p>
              </div>
            </section>

            {/* SECTION 2: Information We Collect */}
            <section id="information-we-collect" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">2</span>
                Information We Collect
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  We collect information to operate effectively and provide you with seamless travel experiences. The data we collect depends on how you interact with our platform:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
                  <li><strong className="text-white">Information You Provide Directly:</strong> Account details, profile preferences, traveler rosters, trip parameters, and direct messaging communications.</li>
                  <li><strong className="text-white">Information Collected Automatically:</strong> Technical metadata, session identifiers, timestamps, IP addresses, browser types, and operational audit logs.</li>
                  <li><strong className="text-white">Information from Third Parties:</strong> Authentication identifiers from Google Sign-In and transaction capture confirmations from PayPal.</li>
                </ul>
              </div>
            </section>

            {/* SECTION 3: Personal Information */}
            <section id="personal-information" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">3</span>
                Personal Information
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>When you register or maintain a profile on WayRivo AI, we collect:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-xs font-bold text-cyan-400 block mb-1">Identity & Contact</span>
                    <p className="text-xs text-slate-300">Full name, primary email address, telephone / WhatsApp number, and optional profile avatar image.</p>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-xs font-bold text-cyan-400 block mb-1">Role & Preferences</span>
                    <p className="text-xs text-slate-300">Platform role (<code className="text-xs text-slate-200">TRAVELER</code>, <code className="text-xs text-slate-200">EXPERT</code>, or <code className="text-xs text-slate-200">ADMIN</code>), preferred currency, home origin city, and travel styles.</p>
                  </div>
                </div>
                <p>
                  For certified travel specialists (<code className="text-cyan-300 text-xs">EXPERT</code>), we also collect professional credentials, agency or organization names, verified licensing documentation, and destination specialization tags.
                </p>
              </div>
            </section>

            {/* SECTION 4: Account and Authentication Information */}
            <section id="account-and-authentication" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">4</span>
                Account and Authentication Information
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  WayRivo supports both traditional email/password credentials and federated single sign-on (SSO):
                </p>
                <div className="space-y-2.5">
                  <div className="p-3.5 bg-surface rounded-xl border border-border space-y-1">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Email & Password Security (bcrypt)
                    </span>
                    <p className="text-xs text-slate-300">
                      We <strong className="text-white">never</strong> store passwords in plaintext. Passwords undergo one-way cryptographic salted hashing using <strong className="text-white">bcrypt with 10 salt rounds</strong> prior to persistence in our database. Password reset tokens are cryptographically randomized, securely hashed, and enforce a strict 60-minute time-to-live (TTL).
                    </p>
                  </div>
                  <div className="p-3.5 bg-surface rounded-xl border border-border space-y-1">
                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Google OAuth 2.0 with PKCE
                    </span>
                    <p className="text-xs text-slate-300">
                      When signing in with Google, we employ the <strong className="text-white">Authorization Code Flow with Proof Key for Code Exchange (PKCE SHA-256)</strong> and HMAC-SHA256 signed state tokens. We store only your Google Subject Identifier (<code className="text-xs text-slate-200">providerAccountId</code>), verified email address, name, and profile picture. We do not obtain or store your Google account password.
                    </p>
                  </div>
                  <div className="p-3.5 bg-surface rounded-xl border border-border space-y-1">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" /> Session Tokens & JWTs
                    </span>
                    <p className="text-xs text-slate-300">
                      Authenticated API calls utilize JSON Web Tokens (JWT) signed with HMAC-SHA256. Tokens are transmitted via Authorization Bearer headers or HttpOnly cookies and include automated session version validation.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 5: Travel and Booking Information */}
            <section id="travel-and-booking-information" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">5</span>
                Travel and Booking Information
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  To match you with verified destination specialists and construct customized day-by-day itineraries, WayRivo collects comprehensive travel parameters:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-300 text-xs sm:text-sm">
                  <li><strong className="text-white">Trip Requests:</strong> Origin city, destination region, travel dates, expected trip duration (days/nights), group type (Solo, Couple, Family, Friends, Corporate), and target budget.</li>
                  <li><strong className="text-white">Traveler Roster:</strong> Full name, gender, age, phone number, and email address for each traveler in the traveling party. These details are required for room occupancy allocations, domestic flight/train reservations, and local government permits.</li>
                  <li><strong className="text-white">Special Requests & Inclusions:</strong> Dietary preferences (e.g., pure vegetarian, halal), physical accessibility requirements, vehicle transport preferences, and celebration notes (e.g., honeymoon, anniversary).</li>
                  <li><strong className="text-white">Booking Records:</strong> Unique booking references (<code className="text-xs text-slate-200">WR-...</code>), escrow hold periods, line-item accommodation and activity breakdown, and proposal acceptance history.</li>
                </ul>
              </div>
            </section>

            {/* SECTION 6: Payment Information */}
            <section id="payment-information" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">6</span>
                Payment Information
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-200">
                  <strong className="text-white block mb-1">PCI-DSS Compliant Infrastructure:</strong>
                  WayRivo AI does <strong className="underline">not</strong> directly handle, process, collect, or store full credit or debit card numbers, card expiration dates, CVV security codes, or PayPal account passwords on our servers.
                </div>
                <p>
                  All financial transactions are processed directly by <strong className="text-white">PayPal Holdings, Inc.</strong> via PayPal Orders v2 APIs. When a payment order is authorized and captured, our backend records only non-sensitive transactional telemetry:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-300 text-xs sm:text-sm">
                  <li>PayPal Order ID (e.g., <code className="text-xs text-slate-200">PAYPAL-ORD-...</code>)</li>
                  <li>PayPal Capture ID (e.g., <code className="text-xs text-slate-200">CAP-...</code>)</li>
                  <li>Transaction amount and currency (<code className="text-xs text-slate-200">USD</code>, <code className="text-xs text-slate-200">INR</code>)</li>
                  <li>Payer PayPal email address, payer name, and PayPal Payer ID</li>
                  <li>Escrow holding status (<code className="text-xs text-slate-200">HELD</code>, <code className="text-xs text-slate-200">DISBURSED</code>, <code className="text-xs text-slate-200">REFUNDED</code>)</li>
                  <li>Cryptographic idempotency keys to prevent duplicate billing charges</li>
                </ul>
              </div>
            </section>

            {/* SECTION 7: AI-Powered Services and Gemini Integration */}
            <section id="ai-powered-services-and-gemini" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">7</span>
                AI-Powered Services and Gemini Integration
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  WayRivo AI features an autonomous travel intelligence engine powered by <strong className="text-white">Google Gemini</strong> (via the Google Cloud Generative Language API, model <code className="text-cyan-300 text-xs">gemini-1.5-flash</code>).
                </p>
                <div className="p-4 bg-surface rounded-xl border border-border space-y-2">
                  <span className="text-xs font-bold text-cyan-400 block">How Gemini Processes Your Prompts:</span>
                  <p className="text-xs text-slate-300">
                    When you request an AI-generated itinerary, chat with the AI Travel Agent, or seek budget recommendations, we transmit relevant trip parameters (destination, trip length, group size, budget tier, and travel style) to the Google Generative Language API.
                  </p>
                  <p className="text-xs text-slate-300">
                    Information submitted to Google Gemini is processed by Google in accordance with the <strong className="text-white">Google Cloud Data Governance and Gemini API Terms of Service</strong>. We do not transmit passwords, financial credentials, or sensitive identity documents to the AI model.
                  </p>
                  <p className="text-xs text-slate-400 italic">
                    Note: Users should refrain from typing highly confidential personal information into free-form AI travel chat boxes.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 8: Cookies and Similar Technologies */}
            <section id="cookies-and-similar-technologies" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">8</span>
                Cookies and Similar Technologies
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  WayRivo AI uses essential browser storage mechanisms (including <code className="text-xs text-slate-200">LocalStorage</code> and secure <code className="text-xs text-slate-200">HttpOnly</code> cookies) strictly necessary for system operation:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2 text-slate-300 text-xs sm:text-sm">
                  <li><strong className="text-white">Session Authentication:</strong> Storing authorization tokens to maintain logged-in state across page reloads.</li>
                  <li><strong className="text-white">Security & CSRF:</strong> Validating anti-forgery tokens during OAuth and checkout requests.</li>
                  <li><strong className="text-white">UI Preferences:</strong> Caching active currency selection (INR, USD, EUR), sidebar collapse states, and draft trip planner inputs.</li>
                </ul>
                <p>
                  WayRivo AI does <strong className="text-white">not</strong> utilize third-party cross-site advertising tracker cookies or sell your browsing history to advertising data brokers.
                </p>
              </div>
            </section>

            {/* SECTION 9: How We Use Your Information */}
            <section id="how-we-use-your-information" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">9</span>
                How We Use Your Information
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>We process collected information for the following legitimate business and service purposes:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-xs font-bold text-cyan-400 block mb-1">Itinerary Crafting</span>
                    <p className="text-xs text-slate-300">Synthesizing customized day-by-day travel schedules matching your style, interests, and budget.</p>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-xs font-bold text-cyan-400 block mb-1">Specialist Matching</span>
                    <p className="text-xs text-slate-300">Connecting your trip request with certified destination specialists who submit competitive bids.</p>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-xs font-bold text-cyan-400 block mb-1">Escrow & Payments</span>
                    <p className="text-xs text-slate-300">Orchestrating PayPal escrow holds, release milestones upon trip delivery, and dispute settlements.</p>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-xs font-bold text-cyan-400 block mb-1">Security & Auditing</span>
                    <p className="text-xs text-slate-300">Detecting malicious access, enforcing role-based permissions, and maintaining immutable audit logs.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 10: How We Share Your Information */}
            <section id="how-we-share-your-information" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">10</span>
                How We Share Your Information
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  We share your data only in the specific, controlled circumstances outlined below:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300 text-xs sm:text-sm">
                  <li><strong className="text-white">With Verified Destination Specialists:</strong> When you submit a trip request, registered travel specialists receive your trip preferences to craft proposals. Once you select and confirm a proposal, your traveler roster (Name, Gender, Age, Phone, Email) is shared with the selected expert to book accommodation and local transit.</li>
                  <li><strong className="text-white">With Payment & Escrow Processors:</strong> Necessary payment parameters are transmitted to PayPal to initialize and capture transactions.</li>
                  <li><strong className="text-white">With AI Infrastructure Providers:</strong> Trip planning queries are dispatched to Google Gemini via API.</li>
                  <li><strong className="text-white">For Legal & Safety Compliance:</strong> We may disclose information if required to comply with a valid court order, national security subpoena, law enforcement inquiry, or to protect the vital safety of travelers.</li>
                </ul>
                <p className="font-semibold text-emerald-400 text-xs pt-1">
                  &bull; We do not sell, rent, monetize, or trade your personal data to third-party data broker networks.
                </p>
              </div>
            </section>

            {/* SECTION 11: Third-Party Services */}
            <section id="third-party-services" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">11</span>
                Third-Party Services
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  WayRivo AI integrates exclusively with the verified third-party technology providers listed below. Each operates under its respective terms and privacy documentation:
                </p>
                <div className="space-y-2.5">
                  <div className="p-3 bg-surface rounded-xl border border-border flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-white block">Supabase (PostgreSQL Database)</span>
                      <span className="text-xs text-slate-400">Cloud database hosting, encryption in transit & at rest, relational persistence.</span>
                    </div>
                    <span className="text-[10px] bg-surface-elevated text-cyan-300 px-2.5 py-1 rounded-md border border-border flex-shrink-0">Database</span>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-white block">PayPal (PayPal Holdings, Inc.)</span>
                      <span className="text-xs text-slate-400">Payment authorization, merchant escrow custody, buyer/seller protection.</span>
                    </div>
                    <span className="text-[10px] bg-surface-elevated text-cyan-300 px-2.5 py-1 rounded-md border border-border flex-shrink-0">Payments</span>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold text-white block">Google Cloud & Google Gemini API</span>
                      <span className="text-xs text-slate-400">Generative AI itinerary synthesis, smart recommendation models, OAuth 2.0.</span>
                    </div>
                    <span className="text-[10px] bg-surface-elevated text-cyan-300 px-2.5 py-1 rounded-md border border-border flex-shrink-0">AI & Auth</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 12: PayPal Payment Processing */}
            <section id="paypal-payment-processing" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">12</span>
                PayPal Payment Processing & Escrow
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  Transactions on WayRivo are powered by the <strong className="text-white">PayPal Developer Sandbox</strong> and PayPal Live REST APIs using the PayPal Orders v2 schema.
                </p>
                <div className="p-4 bg-surface rounded-xl border border-border space-y-2 text-xs">
                  <p className="text-slate-300">
                    <strong className="text-white">Escrow Safeguard Mechanism:</strong> Payments for booked itineraries are authorized and captured into WayRivo&rsquo;s escrow account. Funds remain locked (<code className="text-cyan-300">HELD</code>) until the itinerary start date or successful completion, protecting travelers from unfulfilled services.
                  </p>
                  <p className="text-slate-300">
                    <strong className="text-white">Dispute & Refund Audits:</strong> In the event of valid cancellations per our cancellation tiers or unresolved travel disputes, escrow refund instructions are dispatched through the PayPal Refund API directly to the traveler&rsquo;s funding source.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 13: Supabase Database and Data Storage */}
            <section id="supabase-database-and-storage" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">13</span>
                Supabase Database and Data Storage
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  WayRivo utilizes managed <strong className="text-white">Supabase PostgreSQL</strong> for production data persistence, interfaced via Prisma Object-Relational Mapping (ORM).
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300 text-xs sm:text-sm">
                  <li><strong className="text-white">Data Encryption:</strong> All database connections require SSL/TLS 1.3 encryption in transit (<code className="text-xs text-slate-200">sslmode=require</code>). Supabase infrastructure maintains AES-256 volume encryption at rest.</li>
                  <li><strong className="text-white">Access Separation:</strong> Database access is guarded by environment secret credentials with isolated direct and pooled connection pools. In local development or standalone tests, fallback in-memory repositories mirror the schema without external leakage.</li>
                </ul>
              </div>
            </section>

            {/* SECTION 14: Data Security */}
            <section id="data-security" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">14</span>
                Data Security
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  We implement multi-layered administrative, technical, and architectural security controls:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-xs font-bold text-emerald-400 block mb-1">Cryptographic Hashing</span>
                    <p className="text-xs text-slate-300">bcrypt one-way hashing for user passwords with 10 salt rounds.</p>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-xs font-bold text-cyan-400 block mb-1">Role-Based Access Control</span>
                    <p className="text-xs text-slate-300">Strict backend middleware segregation for Traveler, Expert, and Admin APIs.</p>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-xs font-bold text-cyan-400 block mb-1">Input Sanitization</span>
                    <p className="text-xs text-slate-300">Zod runtime schema validation blocking injection attacks across all endpoints.</p>
                  </div>
                  <div className="p-3 bg-surface rounded-xl border border-border">
                    <span className="text-xs font-bold text-amber-400 block mb-1">Rate Limiting</span>
                    <p className="text-xs text-slate-300">Automated request thresholds protecting authentication routes against brute-force attacks.</p>
                  </div>
                </div>
                <div className="p-3.5 bg-surface rounded-xl border border-border text-xs text-slate-400">
                  <strong className="text-slate-300 block mb-1">Important Security Disclaimer:</strong>
                  While we enforce industry-standard security safeguards, no method of transmission over the Internet or electronic storage is 100% impenetrable. We cannot guarantee absolute security against all unforeseen threats.
                </div>
              </div>
            </section>

            {/* SECTION 15: Data Retention */}
            <section id="data-retention" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">15</span>
                Data Retention
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  We retain personal information for as long as necessary to fulfill the purposes for which it was collected:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300 text-xs sm:text-sm">
                  <li><strong className="text-white">Active User Accounts:</strong> Retained while your account remains active and in good standing.</li>
                  <li><strong className="text-white">Completed Bookings & Invoices:</strong> Retained for 7 years to satisfy mandatory commercial accounting, tax auditing, and regulatory dispute requirements.</li>
                  <li><strong className="text-white">Draft Trip Requests:</strong> Draft requests not submitted to the marketplace may be purged after 90 days of inactivity.</li>
                  <li><strong className="text-white">System Security Logs:</strong> Network telemetry and audit logs are retained for 12 months for forensic analysis before automated rotation.</li>
                </ul>
              </div>
            </section>

            {/* SECTION 16: User Rights and Data Access */}
            <section id="user-rights-and-data-access" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">16</span>
                User Rights and Data Access
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  Depending on your jurisdiction, you have statutory rights concerning your personal information:
                </p>
                <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300 text-xs sm:text-sm">
                  <li><strong className="text-white">Right to Access:</strong> You may request a copy of the personal information we hold about you.</li>
                  <li><strong className="text-white">Right to Rectification:</strong> You can edit and update your personal profile, phone number, and preferences anytime in <Link to="/traveler/profile" className="text-cyan-400 underline">Profile Settings</Link>.</li>
                  <li><strong className="text-white">Right to Portability:</strong> You may request export of your trip requests and itinerary data in machine-readable JSON format.</li>
                  <li><strong className="text-white">Right to Restriction:</strong> You may request restriction of processing while a dispute regarding data accuracy is resolved.</li>
                </ul>
                <p>
                  To exercise any of these rights, contact our privacy desk at <a href="mailto:support@wayrivo.com" className="text-cyan-400 underline font-medium">support@wayrivo.com</a>. We respond to verified requests within 30 days.
                </p>
              </div>
            </section>

            {/* SECTION 17: Account Deletion */}
            <section id="account-deletion" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">17</span>
                Account Deletion
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  You may close your WayRivo AI account and request full erasure of your personal data at any time.
                </p>
                <div className="p-4 bg-surface rounded-xl border border-border text-xs text-slate-300 space-y-2">
                  <p>
                    <strong className="text-white">Account Deletion Process:</strong> Submit a written request from your registered email address to <a href="mailto:support@wayrivo.com" className="text-cyan-400 underline">support@wayrivo.com</a> with the subject line <em>&ldquo;Account Erasure Request&rdquo;</em>.
                  </p>
                  <p>
                    Upon identity verification, your user profile, authentication credentials, and communication logs will be permanently deleted or anonymized within 30 business days, with the exception of completed financial records required by law for statutory tax and escrow compliance.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 18: Children's Privacy */}
            <section id="childrens-privacy" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">18</span>
                Children’s Privacy
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  WayRivo AI is designed for use by individuals aged <strong className="text-white">18 years or older</strong> who can enter into legally binding contracts. We do not knowingly collect personal information directly from children under 16 without parental consent.
                </p>
                <p>
                  When families book trips involving minor travelers, the parent or legal guardian acts as the primary contact and provides the necessary child traveler details (Name, Gender, Age) solely for airline/hotel reservation fulfillment. If we learn we have inadvertently collected personal data directly from a minor without parental consent, we will promptly delete that information.
                </p>
              </div>
            </section>

            {/* SECTION 19: International Data Transfers */}
            <section id="international-data-transfers" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">19</span>
                International Data Transfers
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  WayRivo AI operates cloud services distributed across secure global infrastructure. Depending on your location and chosen destination, your information may be processed in countries other than your country of residence (including regions hosting Supabase, Google Cloud, and PayPal data centers).
                </p>
                <p>
                  Where cross-border transfers occur, we implement adequate technical and contractual safeguards—including Standard Contractual Clauses (SCCs), mutual data protection agreements, and end-to-end TLS encryption—to ensure your personal data receives comparable protection.
                </p>
              </div>
            </section>

            {/* SECTION 20: Changes to This Privacy Policy */}
            <section id="changes-to-this-privacy-policy" className="scroll-mt-28 space-y-3 bg-surface/50 p-6 sm:p-8 rounded-2xl border border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">20</span>
                Changes to This Privacy Policy
              </h2>
              <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                <p>
                  We may periodically revise this Privacy Policy to reflect platform enhancements, new AI models, payment integrations, or evolving legal requirements.
                </p>
                <p>
                  When material changes occur, we will update the &ldquo;Last Updated&rdquo; date at the top of this page and post a prominent notice on the traveler dashboard. Continued use of WayRivo AI following the posting of changes constitutes acceptance of the revised terms.
                </p>
              </div>
            </section>

            {/* SECTION 21: Contact Information */}
            <section id="contact-information" className="scroll-mt-28 space-y-4 bg-gradient-to-br from-surface via-surface-elevated to-surface p-6 sm:p-8 rounded-2xl border border-cyan-500/30 shadow-md">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center justify-center">21</span>
                Contact Information
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                If you have questions, feedback, or concerns regarding this Privacy Policy, our data practices, or wish to exercise your data privacy rights, please reach out to our privacy desk:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <a
                  href="mailto:support@wayrivo.com"
                  className="p-4 rounded-xl bg-navy-dark/80 border border-border hover:border-cyan-400/50 transition-all flex items-start gap-3 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Electronic Inquiries</span>
                    <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">support@wayrivo.com</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Response within 24-48 business hours</span>
                  </div>
                </a>

                <a
                  href="tel:+919876543210"
                  className="p-4 rounded-xl bg-navy-dark/80 border border-border hover:border-cyan-400/50 transition-all flex items-start gap-3 group"
                >
                  <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Telephone & WhatsApp</span>
                    <span className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors">+91 98765 43210</span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">Mon - Sat: 9:00 AM - 7:00 PM IST</span>
                  </div>
                </a>
              </div>

              <div className="pt-4 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
                <span>WayRivo AI 2.0 &bull; Autonomous Travel Orchestration & Escrow Platform</span>
                <Link to="/" className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1">
                  Return to Home <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Floating Back-to-Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-xl bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 transition-all cursor-pointer animate-in fade-in"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default PrivacyPolicyPage;

