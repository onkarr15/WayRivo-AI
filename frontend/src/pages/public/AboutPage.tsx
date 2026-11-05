import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, HeartHandshake, Award, Users, Compass, CheckCircle2, ArrowRight } from 'lucide-react';

const AboutPage: React.FC = () => {
  return (
    <div className="bg-bg min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-white/90 text-sm mb-4">
            <Compass className="w-4 h-4 text-orange" /> Empowering Modern Travelers
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4">
            Transforming How People Plan & Experience Travel
          </h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-base sm:text-lg">
            WayRivo was founded on a simple belief: vacation planning should be effortless, personalized, and transparent.
          </p>
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
            <div className="card p-6 text-center shadow-lg">
              <ShieldCheck className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white">100%</p>
              <p className="text-sm text-slate-400 mt-1">Verified Local Experts</p>
            </div>
            <div className="card p-6 text-center shadow-lg">
              <HeartHandshake className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white">15,000+</p>
              <p className="text-sm text-slate-400 mt-1">Trips Created</p>
            </div>
            <div className="card p-6 text-center shadow-lg">
              <Award className="w-10 h-10 text-amber-400 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white">4.9 / 5</p>
              <p className="text-sm text-slate-400 mt-1">Average Satisfaction</p>
            </div>
            <div className="card p-6 text-center shadow-lg">
              <Users className="w-10 h-10 text-cyan-300 mx-auto mb-3" />
              <p className="text-3xl font-bold text-white">28+</p>
              <p className="text-sm text-slate-400 mt-1">States Covered</p>
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
