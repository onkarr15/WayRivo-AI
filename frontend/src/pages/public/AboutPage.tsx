import React, { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  HeartHandshake,
  Award,
  Users,
  Compass,
  CheckCircle2,
  ArrowRight,
  Lock,
  Shield,
  CreditCard,
  Server,
  Sparkles,
  FileText,
} from 'lucide-react';

const AboutPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const featureParam = searchParams.get('feature');

  useEffect(() => {
    document.title = 'About WayRivo AI | Escrow & Security';

    // Handle smooth scrolling when navigating to specific feature or top
    const timer = setTimeout(() => {
      if (featureParam === 'escrow' || location.hash === '#escrow-terms') {
        const el = document.getElementById('escrow-terms');
        if (el) {
          const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
          window.scrollTo({ top: y, behavior: 'smooth' });
          return;
        }
      } else if (featureParam === 'security' || location.hash === '#security-architecture') {
        const el = document.getElementById('security-architecture');
        if (el) {
          const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
          window.scrollTo({ top: y, behavior: 'smooth' });
          return;
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search, location.hash, featureParam]);

  return (
    <div className="bg-bg min-h-screen text-slate-100">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-white/90 text-sm mb-4">
            <Compass className="w-4 h-4 text-cyan-400" /> Empowering Modern Travelers
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4">
            Transforming How People Plan & Experience Travel
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
            WayRivo was founded on a simple belief: vacation planning should be effortless, personalized, transparent, and 100% financially secure.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <a
              href="#escrow-terms"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('escrow-terms');
                if (el) {
                  const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
              className="px-4 py-2 rounded-xl bg-surface border border-cyan-500/30 text-xs font-semibold text-cyan-300 hover:border-cyan-400 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-cyan-400" /> Escrow Protection Terms
            </a>
            <a
              href="#security-architecture"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById('security-architecture');
                if (el) {
                  const y = el.getBoundingClientRect().top + window.pageYOffset - 90;
                  window.scrollTo({ top: y, behavior: 'smooth' });
                }
              }}
              className="px-4 py-2 rounded-xl bg-surface border border-teal-500/30 text-xs font-semibold text-teal-300 hover:border-teal-400 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-teal-400" /> Security Architecture
            </a>
            <Link
              to="/privacy-policy"
              className="px-4 py-2 rounded-xl bg-surface border border-border text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Privacy Policy
            </Link>
          </div>
        </div>
      </section>

      {/* Mission & Story */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Our Mission</span>
            <h2 className="text-3xl font-extrabold text-white mt-2 mb-6">
              Putting Travelers in Control of Their Journeys
            </h2>
            <div className="space-y-4 text-slate-300 text-base leading-relaxed">
              <p>
                Traditional online travel booking is overwhelming. Travelers spend hours comparing hundreds of generic tour packages that don’t fit their schedules or budget constraints.
              </p>
              <p>
                WayRivo reverses the model. Instead of sifting through static packages, you tell us what you desire, and verified destination specialists compete to design the perfect itinerary for your exact budget.
              </p>
              <p>
                Whether you're looking for an off-the-beaten-path Himalayan trek, a romantic Kerala backwaters retreat, or a luxury Rajasthan heritage tour, WayRivo connects you with the people who know it best.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="card p-6 text-center shadow-lg border border-border">
              <ShieldCheck className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white">100%</p>
              <p className="text-sm text-slate-400 mt-1">Verified Local Experts</p>
            </div>
            <div className="card p-6 text-center shadow-lg border border-border">
              <HeartHandshake className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white">15,000+</p>
              <p className="text-sm text-slate-400 mt-1">Trips Created</p>
            </div>
            <div className="card p-6 text-center shadow-lg border border-border">
              <Award className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white">4.9 / 5</p>
              <p className="text-sm text-slate-400 mt-1">Average Satisfaction</p>
            </div>
            <div className="card p-6 text-center shadow-lg border border-border">
              <Users className="w-10 h-10 text-cyan-300 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white">28+</p>
              <p className="text-sm text-slate-400 mt-1">States Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 1: Escrow Protection Terms */}
      <section id="escrow-terms" className="scroll-mt-28 py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-surface-elevated via-surface to-surface-dark border border-cyan-500/30 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-border/80 relative z-10">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">
                <Lock className="w-3.5 h-3.5" /> WayRivo Escrow Guarantee
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                100% Escrow Protection Terms
              </h2>
              <p className="text-sm text-slate-300 max-w-xl mt-1">
                All booking payments are held securely in escrow until journey delivery. Your money is never released upfront until milestones are verified.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="px-4 py-2 rounded-xl bg-navy-dark/90 border border-cyan-500/30 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Custody Provider</span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 justify-center">
                  <ShieldCheck className="w-3.5 h-3.5" /> PayPal Orders v2
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="p-5 rounded-2xl bg-surface/80 border border-border hover:border-cyan-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Milestone Holding</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When you accept a specialist proposal, your payment is placed in escrow custody. Funds remain securely locked throughout the itinerary planning phase.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface/80 border border-border hover:border-teal-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center mb-3">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Zero Upfront Risk</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Specialists receive payment disbursals only upon verified journey milestones. If a service provider defaults, you are fully backed by WayRivo Escrow.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-surface/80 border border-border hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">Guaranteed Refund API</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                In case of valid cancellations or travel plan adjustments, refunds are programmatically processed through the PayPal Refund API directly to your original payment method.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 2: Platform Security Architecture */}
      <section id="security-architecture" className="scroll-mt-28 py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-surface via-surface-elevated to-surface-dark border border-teal-500/30 shadow-xl relative overflow-hidden">
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-border/80 relative z-10">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-xs font-bold text-teal-300 uppercase tracking-wider mb-2">
                <Shield className="w-3.5 h-3.5" /> Enterprise Trust Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Platform Security & Architecture
              </h2>
              <p className="text-sm text-slate-300 max-w-xl mt-1">
                WayRivo AI is architected with defense-in-depth principles protecting traveler credentials, identity rosters, and booking transactions.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Link to="/privacy-policy" className="btn-secondary text-xs px-4 py-2">
                <FileText className="w-3.5 h-3.5" /> Read Full Privacy Policy
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            <div className="p-4.5 rounded-2xl bg-surface/80 border border-border hover:border-cyan-500/40 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-2.5">
                <Lock className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">bcrypt Hashing</h4>
              <p className="text-xs text-slate-400">10-round salted one-way cryptographic password hashing. Zero plaintext storage.</p>
            </div>

            <div className="p-4.5 rounded-2xl bg-surface/80 border border-border hover:border-teal-500/40 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-teal-500/15 text-teal-400 flex items-center justify-center mb-2.5">
                <Server className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Google OAuth PKCE</h4>
              <p className="text-xs text-slate-400">Authorization Code Flow with SHA-256 PKCE challenges and signed state tokens.</p>
            </div>

            <div className="p-4.5 rounded-2xl bg-surface/80 border border-border hover:border-emerald-500/40 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Supabase SSL/TLS</h4>
              <p className="text-xs text-slate-400">Database connections strictly require SSL/TLS 1.3 with AES-256 volume encryption.</p>
            </div>

            <div className="p-4.5 rounded-2xl bg-surface/80 border border-border hover:border-amber-500/40 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-2.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">Zod & RBAC Defense</h4>
              <p className="text-xs text-slate-400">Runtime input validation and role separation preventing unauthorized elevation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-surface/40 py-16 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Core Pillars</span>
            <h2 className="text-3xl font-bold text-white mt-1">What Sets WayRivo Apart</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-surface border border-border">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Authentic Human Verification</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                We stringently vet every travel agency and guide before they can submit proposals on our platform.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Honest, Unbundled Pricing</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                No hidden agency fees or forced markups. Compare line-item inclusions, vehicles, and stay tiers clearly.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-border">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-300 mb-4">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Traveler-First Support</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Direct messaging with your planner and on-trip assistance ensures peace of mind from takeoff to landing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 text-center max-w-4xl mx-auto px-4">
        <h2 className="text-3xl font-extrabold text-white mb-3">Begin Your Next Story With Us</h2>
        <p className="text-slate-300 mb-8 max-w-lg mx-auto">
          Post your trip parameters in 2 minutes and let certified travel creators surprise you with unforgettable itineraries.
        </p>
        <Link to="/traveler/create-trip" className="btn-primary px-8 py-3 text-base">
          Start Planning Now <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
};

export default AboutPage;
