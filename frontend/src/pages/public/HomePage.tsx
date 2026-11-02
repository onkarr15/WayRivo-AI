import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  Shield,
  Star,
  ArrowRight,
  Compass,
  CheckCircle,
  Sparkles,
  Lock,
  Bot,
  Zap,
} from 'lucide-react';
import { publicService, destinationService, expertService, reviewService } from '../../services';
import { SearchBar } from '../../components/ui/SearchBar';
import { DestinationCard } from '../../components/ui/DestinationCard';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>({});
  const [destinations, setDestinations] = useState<any[]>([]);
  const [experts, setExperts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    publicService.getStatistics().then((r) => setStats(r.data?.data || {})).catch(() => {});
    destinationService.getPopular().then((r) => setDestinations(r.data?.data || [])).catch(() => {});
    expertService.getFeatured().then((r) => setExperts(r.data?.data || [])).catch(() => {});
    reviewService.getRecent().then((r) => setReviews(r.data?.data || [])).catch(() => {});
  }, []);

  const handleSearch = (params: { query: string; destination: string }) => {
    navigate(`/explore?search=${encodeURIComponent(params.query || params.destination)}`);
  };

  const handleDestinationExplore = (id: number | string) => {
    navigate(`/destinations/${id}`);
  };

  return (
    <div className="bg-navy-dark min-h-screen text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Cinematic Hero Section */}
      <section className="relative pt-28 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        {/* Background Radial Glow Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-cyan-500/10 via-teal-500/15 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-amber-400/5 rounded-full blur-[130px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* AI Badge Pill */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-6 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>WayRivo AI 2.0 &bull; PayPal Hackathon 2026 Edition</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto"
          >
            Your Trip. Your Budget.{' '}
            <span className="text-gradient-cyan block sm:inline">Your Way.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-slate-300 mt-6 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Don't search blindly across hundreds of tabs. Tell WayRivo AI your travel dreams, let verified destination specialists build tailored packages, and checkout securely with PayPal Escrow.
          </motion.p>

          {/* Reusable SearchBar Component */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 sm:mt-12"
          >
            <SearchBar onSearch={handleSearch} />
          </motion.div>

          {/* Action CTAs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-8"
          >
            <Link to="/traveler/create-trip">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Create Custom Trip Request
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="secondary" size="lg">
                How It Works
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Live Marketplace Telemetry Metrics */}
      <section className="relative -mt-6 z-10 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Verified Specialists', value: stats.verifiedExperts || '50+', icon: Shield, color: 'text-cyan-400' },
            { label: 'Trips Synthesized', value: stats.tripsCreated || '1,200+', icon: FileText, color: 'text-teal-400' },
            { label: 'Bespoke Proposals', value: stats.proposalsSubmitted || '3,500+', icon: Compass, color: 'text-amber-400' },
            { label: 'Happy Travelers', value: stats.travelersServed || '4,800+', icon: Users, color: 'text-cyan-300' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="card-glow p-5 sm:p-6 text-center rounded-2xl bg-surface/90 border border-white/10"
            >
              <Icon className={`w-7 h-7 mx-auto mb-2.5 ${color}`} />
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">{value}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How WayRivo AI Works */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="cyan" size="sm" icon={<Zap className="w-3.5 h-3.5 text-cyan-400" />}>
            Intelligent Commerce
          </Badge>
          <h2 className="section-title mt-3">How WayRivo AI Works</h2>
          <p className="section-subtitle mx-auto">
            Experience the future of travel planning in four seamless steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Express Your Intent',
              desc: 'Chat with our Google Gemini agent or submit your budget, style, dates, and group size.',
              icon: Bot,
            },
            {
              step: '02',
              title: 'Specialists Curate Plans',
              desc: 'Verified on-ground destination agencies compete with tailored itineraries and best rates.',
              icon: Compass,
            },
            {
              step: '03',
              title: 'Compare & Select',
              desc: 'Inspect day-by-day itineraries, hotel classes, private transport, and total pricing side-by-side.',
              icon: Star,
            },
            {
              step: '04',
              title: 'PayPal Escrow Protection',
              desc: 'Authorize securely with PayPal Developer Sandbox. Funds are safely held until your trip completes.',
              icon: Lock,
            },
          ].map(({ step, title, desc, icon: Icon }) => (
            <div
              key={step}
              className="group p-6 rounded-3xl bg-surface/80 border border-border hover:border-cyan-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-black font-mono text-slate-600 group-hover:text-cyan-400 transition-colors">
                    {step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-bold text-lg text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Popular Destinations Showcase using DestinationCard */}
      <section className="py-20 bg-surface/40 border-y border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <Badge variant="gold" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}>
                Curated Escapes
              </Badge>
              <h2 className="section-title mt-2">Popular Destinations</h2>
              <p className="section-subtitle">
                Discover iconic regions handpicked for unforgettable cultural and nature adventures
              </p>
            </div>
            <Link to="/explore">
              <Button variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View All Destinations
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(destinations.length > 0
              ? destinations
              : [
                  {
                    id: 1,
                    name: 'Manali & Kasol',
                    state: 'Himachal Pradesh',
                    country: 'India',
                    averageBudget: 25000,
                    bestTimeToVisit: 'Oct - May',
                    imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
                    isPopular: true,
                  },
                  {
                    id: 2,
                    name: 'Goa Beaches',
                    state: 'Goa',
                    country: 'India',
                    averageBudget: 35000,
                    bestTimeToVisit: 'Nov - Feb',
                    imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800',
                    isPopular: true,
                  },
                  {
                    id: 3,
                    name: 'Munnar & Alleppey',
                    state: 'Kerala',
                    country: 'India',
                    averageBudget: 40000,
                    bestTimeToVisit: 'Sep - Mar',
                    imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800',
                    isPopular: true,
                  },
                  {
                    id: 4,
                    name: 'Jaipur & Udaipur',
                    state: 'Rajasthan',
                    country: 'India',
                    averageBudget: 45000,
                    bestTimeToVisit: 'Oct - Mar',
                    imageUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800',
                    isPopular: true,
                  },
                ]
            )
              .slice(0, 8)
              .map((d: any) => (
                <DestinationCard
                  key={d.id}
                  id={d.id}
                  name={d.name}
                  state={d.state}
                  country={d.country}
                  description={d.description}
                  imageUrl={d.imageUrl}
                  averageBudget={d.averageBudget}
                  bestTimeToVisit={d.bestTimeToVisit}
                  isPopular={d.isPopular || d.id === 1}
                  onExplore={handleDestinationExplore}
                />
              ))}
          </div>
        </div>
      </section>

      {/* Featured Verified Specialists */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="turquoise" size="sm" icon={<Shield className="w-3.5 h-3.5 text-teal-300" />}>
            Verified Partner Agencies
          </Badge>
          <h2 className="section-title mt-3">Destination Specialists</h2>
          <p className="section-subtitle mx-auto">
            Licensed local experts dedicated to crafting authentic, customized journeys
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(experts.length > 0
            ? experts
            : [
                {
                  id: 1,
                  name: 'Vikram Mehta',
                  organizationName: 'Himalayan Journeys & Treks',
                  verificationStatus: 'VERIFIED',
                  description:
                    'Over 8 years crafting authentic Himalayan treks, luxury river valley camps, and boutique mountain homestays.',
                  rating: 4.9,
                  totalReviews: 28,
                  yearsOfExperience: 8,
                },
                {
                  id: 2,
                  name: 'Ananya Sharma',
                  organizationName: 'Kerala Bliss Tours & Houseboats',
                  verificationStatus: 'VERIFIED',
                  description:
                    'Certified South India destination specialist with exclusive backwater houseboat fleet partnerships and Ayurvedic retreats.',
                  rating: 5.0,
                  totalReviews: 42,
                  yearsOfExperience: 6,
                },
                {
                  id: 3,
                  name: 'Suresh Rao',
                  organizationName: 'Royal Rajasthan Safaris',
                  verificationStatus: 'VERIFIED',
                  description:
                    'Specialized in royal palace stays, Thar desert luxury camping, and private vintage chauffeured cultural trails.',
                  rating: 4.8,
                  totalReviews: 35,
                  yearsOfExperience: 11,
                },
              ]
          )
            .slice(0, 6)
            .map((e: any) => (
              <div
                key={e.id}
                className="card p-6 flex flex-col justify-between hover:border-cyan-500/40 transition-all duration-300"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-slate-950 font-black text-base flex-shrink-0">
                      {e.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-white text-base truncate">{e.name}</h3>
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-cyan-400 font-medium truncate mt-0.5">
                        {e.organizationName}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-400 mt-4 line-clamp-3 leading-relaxed">
                    {e.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/80">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-sm font-bold text-white">{e.rating}</span>
                    <span className="text-xs text-slate-500">({e.totalReviews} reviews)</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {e.yearsOfExperience} yrs exp
                  </span>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Traveler Reviews & Testimonials */}
      <section className="py-20 bg-surface/30 border-t border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="cyan" size="sm" icon={<Star className="w-3.5 h-3.5 text-cyan-400" />}>
              Verified Traveler Stories
            </Badge>
            <h2 className="section-title mt-2">What Travelers Say</h2>
            <p className="section-subtitle mx-auto">
              Real feedback from travelers who booked through WayRivo escrow protection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(reviews.length > 0
              ? reviews
              : [
                  {
                    id: 1,
                    travelerName: 'Arjun Sharma',
                    organizationName: 'Himalayan Journeys',
                    rating: 5,
                    comment:
                      'WayRivo AI made planning our mountain trip effortless. The specialist itinerary was 100% customized to our family pace.',
                  },
                  {
                    id: 2,
                    travelerName: 'Priya Patel',
                    organizationName: 'Kerala Bliss Tours',
                    rating: 5,
                    comment:
                      'Receiving 3 proposals from top local experts within hours helped us compare costs and choose a dream backwater houseboat stay.',
                  },
                  {
                    id: 3,
                    travelerName: 'Rahul Verma',
                    organizationName: 'Royal Rajasthan Safaris',
                    rating: 5,
                    comment:
                      'The PayPal escrow deposit gave us immense confidence. Everything from the private chauffeur to palace dinner was top tier.',
                  },
                ]
            )
              .slice(0, 3)
              .map((r: any) => (
                <div key={r.id} className="card p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (r.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                      "{r.comment}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/80">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-xs">
                      {r.travelerName?.charAt(0) || 'T'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{r.travelerName}</h4>
                      <p className="text-[10px] text-slate-400">via {r.organizationName || 'Specialist'}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* Escrow CTA Section */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-b from-navy to-navy-dark border-t border-border/80">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Badge variant="cyan" size="sm" glow icon={<Lock className="w-3.5 h-3.5 text-cyan-400" />}>
            PayPal Escrow Protection Guaranteed
          </Badge>
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 tracking-tight">
            Ready to Plan Your Perfect Vacation?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
            Create your custom travel request in minutes. Receive competing bids from verified agencies, choose your preferred itinerary, and travel with peace of mind.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link to="/traveler/create-trip">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Create Your Trip Now
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="secondary" size="lg">
                Register as Travel Specialist
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
