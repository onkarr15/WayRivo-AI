import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileEdit, CheckCircle2, MessageSquare, CreditCard, Shield, Sparkles, ArrowRight, Award } from 'lucide-react';

const HowItWorksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'traveler' | 'expert'>('traveler');

  return (
    <div className="bg-bg min-h-screen">
      {/* Hero Header */}
      <section className="bg-gradient-to-br from-navy via-navy-light to-navy text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-white/90 text-sm mb-4">
            <Sparkles className="w-4 h-4 text-orange" /> The Reverse Travel Marketplace
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4">How WayRivo Works</h1>
          <p className="text-gray-300 max-w-2xl mx-auto text-base sm:text-lg">
            Say goodbye to endless browsing and cookie-cutter holiday packages. WayRivo puts travelers in control while empowering top local specialists to design dream vacations.
          </p>

          {/* Toggle Switch */}
          <div className="flex justify-center mt-8">
            <div className="bg-white/10 p-1 rounded-2xl inline-flex backdrop-blur">
              <button
                onClick={() => setActiveTab('traveler')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'traveler' ? 'bg-orange text-white shadow-lg' : 'text-gray-300 hover:text-white'
                }`}
              >
                For Travelers
              </button>
              <button
                onClick={() => setActiveTab('expert')}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'expert' ? 'bg-orange text-white shadow-lg' : 'text-gray-300 hover:text-white'
                }`}
              >
                For Travel Experts
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {activeTab === 'traveler' ? (
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-navy">Plan Your Trip in 4 Simple Steps</h2>
              <p className="text-text-light mt-2">Get personalized quotes without paying booking broker fees.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  icon: FileEdit,
                  title: 'Post Your Trip Request',
                  desc: 'Specify where you want to go, dates, party size, target budget, and hotel preferences in less than 2 minutes.',
                },
                {
                  step: '02',
                  icon: Award,
                  title: 'Receive Custom Proposals',
                  desc: 'Verified destination specialists craft detailed day-by-day itineraries and competitive price estimates.',
                },
                {
                  step: '03',
                  icon: MessageSquare,
                  title: 'Compare & Chat',
                  desc: 'Compare proposals side-by-side. Message experts directly to refine hotel choices, activities, and timings.',
                },
                {
                  step: '04',
                  icon: CreditCard,
                  title: 'Confirm & Pack Bags',
                  desc: 'Select your preferred proposal, lock in transparent pricing, and enjoy 24/7 on-ground assistance during your trip.',
                },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="card p-6 relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange/10 flex items-center justify-center text-orange font-bold">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-3xl font-extrabold text-border">{item.step}</span>
                      </div>
                      <h3 className="text-lg font-bold text-navy mb-2">{item.title}</h3>
                      <p className="text-sm text-text-light leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card p-8 bg-gradient-to-r from-orange/10 via-amber-50 to-orange/5 border-orange/20 text-center">
              <h3 className="text-2xl font-bold text-navy mb-2">Ready to try WayRivo?</h3>
              <p className="text-text-light max-w-lg mx-auto mb-6">
                Tell us your travel dream today and receive hand-tailored proposals within 24 hours.
              </p>
              <Link to="/traveler/create-trip" className="btn-primary px-8 py-3 text-base">
                Create Free Trip Request <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-navy">Grow Your Travel Business with Qualified Leads</h2>
              <p className="text-text-light mt-2">Connect with verified travelers seeking custom tours in your specialty areas.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  step: '01',
                  icon: Shield,
                  title: 'Register & Verify',
                  desc: 'Sign up as a travel agency or independent consultant. Get vetted by our team to earn the verified badge.',
                },
                {
                  step: '02',
                  icon: FileEdit,
                  title: 'Browse High-Intent Requests',
                  desc: 'Access filtered marketplace requests from travelers with defined budgets, dates, and clear expectations.',
                },
                {
                  step: '03',
                  icon: Award,
                  title: 'Submit Tailored Proposals',
                  desc: 'Send custom itineraries, pricing breakdowns, and inclusions that highlight your local connections and perks.',
                },
                {
                  step: '04',
                  icon: CheckCircle2,
                  title: 'Win Bookings & Build Reputation',
                  desc: 'Get booked directly, collect 5-star traveler reviews, and scale your repeat business on WayRivo.',
                },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="card p-6 relative flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-navy/10 flex items-center justify-center text-navy font-bold">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-3xl font-extrabold text-border">{item.step}</span>
                      </div>
                      <h3 className="text-lg font-bold text-navy mb-2">{item.title}</h3>
                      <p className="text-sm text-text-light leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card p-8 bg-gradient-to-r from-navy/5 to-navy/10 border-navy/20 text-center">
              <h3 className="text-2xl font-bold text-navy mb-2">Join as a Verified Travel Partner</h3>
              <p className="text-text-light max-w-lg mx-auto mb-6">
                Expand your clientele and respond to travelers looking for your exact geographic expertise.
              </p>
              <Link to="/register" className="btn-secondary px-8 py-3 text-base">
                Apply for Expert Verification <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default HowItWorksPage;
