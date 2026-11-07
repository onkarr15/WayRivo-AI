import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  Users,
  FileText,
  Shield,
  Star,
  ArrowRight,
  Compass,
  Sparkles,
  Lock,
  Bot,
  Zap,
  TrendingUp,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Layers,
  HeartHandshake,
} from 'lucide-react';
import { publicService, destinationService } from '../../services';
import { AITravelSearchPanel } from '../../components/ui/AITravelSearchPanel';
import { DestinationCard } from '../../components/ui/DestinationCard';
import { PackageCard } from '../../components/ui/PackageCard';
import { AIAssistantPromotion } from '../../components/ui/AIAssistantPromotion';
import { FAQSection } from '../../components/ui/FAQSection';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  fadeUp,
  scaleReveal,
  staggerContainer,
  staggerItem,
  wordStaggerContainer,
  wordStaggerItem,
  viewportTrigger,
} from '../../utils/animations';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [stats, setStats] = useState<any>({});
  const [destinations, setDestinations] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Background Parallax
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 800], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 600], [1, 0.45]);

  // Carousel ref for horizontal destinations
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    publicService.getStatistics().then((r) => setStats(r.data?.data || {})).catch(() => {});
    destinationService.getPopular().then((r) => setDestinations(r.data?.data || [])).catch(() => {});
  }, []);

  const fallbackDestinations = [
    {
      id: 1,
      name: 'Kerala Backwaters & Munnar',
      state: 'Kerala',
      country: 'India',
      description: 'Lush tea plantations, spice gardens, and tranquil houseboat cruises through Alleppey backwaters.',
      averageBudget: 25000,
      bestTimeToVisit: 'Sep - Mar',
      imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800',
      isPopular: true,
    },
    {
      id: 2,
      name: 'Goa Coastal Shores',
      state: 'Goa',
      country: 'India',
      description: 'Golden sands, vibrant coastal nightlife, Portuguese architecture, and fresh seafood shacks.',
      averageBudget: 20000,
      bestTimeToVisit: 'Nov - Feb',
      imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800',
      isPopular: true,
    },
    {
      id: 3,
      name: 'Royal Rajasthan & Udaipur',
      state: 'Rajasthan',
      country: 'India',
      description: 'Majestic hill forts, ornate desert palaces, Lake Pichola sunset boat rides, and desert camel safaris.',
      averageBudget: 30000,
      bestTimeToVisit: 'Oct - Mar',
      imageUrl: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800',
      isPopular: true,
    },
    {
      id: 4,
      name: 'Manali & Solang Valley',
      state: 'Himachal Pradesh',
      country: 'India',
      description: 'Snow-clad peaks, roaring Beas river, pine valleys, and mountain adventure sports.',
      averageBudget: 22000,
      bestTimeToVisit: 'Oct - May',
      imageUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800',
      isPopular: true,
    },
    {
      id: 5,
      name: 'Ladakh High Passes',
      state: 'Ladakh',
      country: 'India',
      description: 'Pangong Tso azure waters, ancient Buddhist monasteries, and high-altitude desert passes.',
      averageBudget: 35000,
      bestTimeToVisit: 'Jun - Sep',
      imageUrl: 'https://images.unsplash.com/photo-1626015365107-4986c390e5d2?w=800',
      isPopular: true,
    },
    {
      id: 6,
      name: 'Andaman & Havelock Island',
      state: 'Andaman',
      country: 'India',
      description: 'Crystal-clear turquoise waters, coral reef scuba diving, and white sand Radhanagar beach.',
      averageBudget: 28000,
      bestTimeToVisit: 'Oct - May',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    },
  ];

  const displayDestinations = destinations.length > 0 ? destinations : fallbackDestinations;

  const popularPackages = [
    {
      id: 1,
      category: 'Backwaters',
      title: 'Kerala Serenity & Spice Trails — 6 Days All-Inclusive',
      expertName: 'Kerala Travel Collective',
      organizationName: 'Kerala Travel Collective',
      expertRating: 4.9,
      expertReviews: 24,
      durationDays: 6,
      totalPrice: 48000,
      pricePerPerson: 24000,
      currency: 'INR',
      inclusions: [
        'Private luxury AC houseboat cruise in Alleppey',
        '2 nights at 5-star Munnar tea plantation resort',
        'Chauffeur-driven AC SUV from Kochi throughout',
        'Kathakali cultural performance and spice garden tour',
      ],
      cancellationPolicy: '100% refund up to 14 days prior; 50% refund up to 7 days',
      isRecommended: true,
    },
    {
      id: 2,
      category: 'Heritage & Luxury',
      title: 'Royal Rajasthan Heritage & Palace Trail — 7 Days Luxury',
      expertName: 'Rajputana Heritage Tours',
      organizationName: 'Rajputana Heritage Tours',
      expertRating: 5.0,
      expertReviews: 31,
      durationDays: 7,
      totalPrice: 78000,
      pricePerPerson: 39000,
      currency: 'INR',
      inclusions: [
        'Lake-facing heritage palace hotel in Udaipur',
        'Desert camp under the stars in Jaisalmer',
        'Private AC sedan with chauffeur throughout',
        'Amber Fort & Mehrangarh Fort VIP entry',
      ],
      cancellationPolicy: 'Full refund 21 days prior; 50% refund 14-20 days',
      isRecommended: true,
    },
    {
      id: 3,
      category: 'Adventure',
      title: 'Ladakh High-Pass Expedition — 9 Days Adventure',
      expertName: 'Meera Adventures India',
      organizationName: 'Meera Adventures India',
      expertRating: 4.8,
      expertReviews: 18,
      durationDays: 9,
      totalPrice: 108000,
      pricePerPerson: 18000,
      currency: 'INR',
      inclusions: [
        'Khardung La crossing & Pangong Lake Swiss camps',
        'Fleet of Toyota Innova Crysta with mountain drivers',
        'Inner line permits & onboard oxygen kits',
        'Monastery visits & Bactrian camel safari',
      ],
      cancellationPolicy: 'Full refund 30 days before; 50% refund 15-29 days',
      isRecommended: false,
    },
    {
      id: 4,
      category: 'Beach',
      title: 'Goa Coastal Serenity & Heritage Villa Retreat',
      expertName: 'Sunita Beach Holidays',
      organizationName: 'Sunita Beach Holidays',
      expertRating: 4.7,
      expertReviews: 19,
      durationDays: 5,
      totalPrice: 42000,
      pricePerPerson: 10500,
      currency: 'INR',
      inclusions: [
        'Portuguese luxury boutique villa in South Goa',
        'Dudhsagar waterfall private jeep excursion',
        'Sunset catamaran cruise with welcome drinks',
        'Airport executive transfers',
      ],
      cancellationPolicy: 'Free cancellation up to 10 days before',
      isRecommended: false,
    },
  ];

  const filteredPackages =
    selectedCategory === 'All'
      ? popularPackages
      : popularPackages.filter((p) => p.category === selectedCategory);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -380 : 380;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleDestinationExplore = (id: number | string) => {
    navigate(`/destinations/${id}`);
  };

  const handlePackageSelect = (pkgId: number | string) => {
    navigate(`/traveler/create-trip?packageId=${pkgId}`);
  };

  const sampleTestimonials = [
    {
      name: 'Aditya & Neha Singhania',
      role: 'Family Vacation • Pune',
      destination: 'Kerala 5-Day Retreat',
      stars: 5,
      avatar: 'A',
      quote:
        'WayRivo AI synthesized an itinerary that suited both our toddler and parents. Having our deposit held securely in PayPal escrow gave us complete peace of mind.',
    },
    {
      name: 'Kavita Menon',
      role: 'Solo Cultural Explorer • Bangalore',
      destination: 'Rajasthan Royal Heritage',
      stars: 5,
      avatar: 'K',
      quote:
        'I received three competing proposals from verified specialists in Jaipur within 6 hours. Direct chat allowed me to fine-tune hotel choices before payment.',
    },
    {
      name: 'Rohan Deshmukh & Friends',
      role: 'Adventure Group • Mumbai',
      destination: 'Ladakh 9-Day Expedition',
      stars: 5,
      avatar: 'R',
      quote:
        'The oxygen safety protocol, permits, and Swiss camps at Pangong were perfectly organized. The transparent pricing and escrow release model is unmatched.',
    },
  ];

  const heroWords = [
    { text: 'Your', gradient: false },
    { text: 'Journey.', gradient: false },
    { text: 'Your', gradient: false },
    { text: 'Budget.', gradient: false },
    { text: 'Your', gradient: true },
    { text: 'AI.', gradient: true },
  ];

  return (
    <div className="bg-navy-dark min-h-screen text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 2. HERO SECTION WITH CINEMATIC PARALLAX & WORD STAGGER */}
      <section className="relative pt-32 pb-24 md:pt-44 md:pb-36 overflow-hidden">
        {/* Background Travel Photography with Smooth Depth Parallax */}
        <motion.div
          style={{ y: shouldReduceMotion ? 0 : bgY, opacity: heroOpacity }}
          className="absolute inset-0 z-0 will-change-transform"
        >
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1920&q=80"
            alt="Cinematic World Travel"
            className="w-full h-full object-cover object-center brightness-[0.28] filter contrast-110 scale-105"
            loading="eager"
          />
          {/* Deep Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/95 via-navy-dark/80 to-navy-dark" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[450px] bg-gradient-to-tr from-cyan-500/15 via-teal-500/20 to-transparent rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute top-16 right-16 w-80 h-80 bg-amber-400/10 rounded-full blur-[140px] pointer-events-none" />
        </motion.div>


        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Intelligent Travel Badge Pill */}
          <motion.div
            variants={fadeUp}
            initial={shouldReduceMotion ? false : 'hidden'}
            animate="visible"
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-xs font-black uppercase tracking-widest mb-6 shadow-[0_0_20px_rgba(0,240,255,0.25)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>WayRivo AI 2.0 • Autonomous Travel Ecosystem</span>
          </motion.div>

          {/* Heading with Word Stagger Entrance */}
          <motion.h1
            variants={wordStaggerContainer}
            initial={shouldReduceMotion ? false : 'hidden'}
            animate="visible"
            className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] max-w-5xl mx-auto font-heading flex flex-wrap justify-center gap-x-3 gap-y-1"
          >
            {heroWords.map((word, i) => (
              <motion.span
                key={i}
                variants={wordStaggerItem}
                initial={shouldReduceMotion ? false : 'hidden'}
                animate="visible"
                className={word.gradient ? 'text-gradient-cyan inline-block' : 'inline-block text-white'}
              >
                {word.text}
              </motion.span>
            ))}
          </motion.h1>

          {/* Supporting text */}
          <motion.p
            variants={fadeUp}
            initial={shouldReduceMotion ? false : 'hidden'}
            animate="visible"
            custom={3}
            className="text-base sm:text-xl text-slate-300 mt-6 max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Discover destinations, plan smarter journeys and experience intelligent travel booking with WayRivo AI.
          </motion.p>

          {/* CTA Buttons with Micro-interactions */}
          <motion.div
            variants={fadeUp}
            initial={shouldReduceMotion ? false : 'hidden'}
            animate="visible"
            custom={4}
            className="flex flex-wrap items-center justify-center gap-4 mt-8"
          >
            <Link to="/explore">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore Destinations
              </Button>
            </Link>

            <Link to="/traveler/create-trip">
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Bot className="w-4 h-4 text-cyan-400" />}
              >
                Plan with AI
              </Button>
            </Link>
          </motion.div>

          {/* 3. AI TRAVEL SEARCH FLOATING PANEL */}
          <motion.div
            variants={fadeUp}
            initial={shouldReduceMotion ? false : 'hidden'}
            animate="visible"
            custom={5}
            className="mt-12 sm:mt-16"
          >
            <AITravelSearchPanel />
          </motion.div>
        </div>
      </section>

      {/* Live Marketplace Telemetry Metrics with Animated Counters */}
      <section className="relative -mt-4 z-10 max-w-6xl mx-auto px-4">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportTrigger}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Verified Specialists', value: stats.verifiedExperts || 50, suffix: '+', icon: Shield, color: 'text-cyan-400' },
            { label: 'Trips Synthesized', value: stats.tripsCreated || 1200, suffix: '+', icon: FileText, color: 'text-teal-400' },
            { label: 'Proposals Submitted', value: stats.proposalsSubmitted || 3500, suffix: '+', icon: Compass, color: 'text-amber-400' },
            { label: 'Happy Travelers', value: stats.travelersServed || 4800, suffix: '+', icon: Users, color: 'text-cyan-300' },
          ].map(({ label, value, suffix, icon: Icon, color }) => (
            <motion.div
              key={label}
              variants={staggerItem}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
              className="card-glow p-5 sm:p-6 text-center rounded-2xl bg-surface/90 border border-white/10"
            >
              <Icon className={`w-7 h-7 mx-auto mb-2.5 ${color}`} />
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">
                <AnimatedCounter value={value} suffix={suffix} />
              </p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 4. FEATURED DESTINATIONS CAROUSEL */}
      <section id="destinations" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportTrigger}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10"
        >
          <div>
            <Badge variant="cyan" size="sm" icon={<Compass className="w-3.5 h-3.5 text-cyan-400" />}>
              Featured Destinations
            </Badge>
            <h2 className="section-title mt-2">Discover Iconic Landscapes</h2>
            <p className="section-subtitle">
              Browse actual database inventory with verified local rates and real availability
            </p>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => scrollCarousel('left')}
              className="w-10 h-10 rounded-xl bg-surface border border-border-light flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-400/40 transition-all cursor-pointer"
              aria-label="Previous destination"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="w-10 h-10 rounded-xl bg-surface border border-border-light flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:border-cyan-400/40 transition-all cursor-pointer"
              aria-label="Next destination"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Horizontal Swipeable / Scrollable Carousel */}
        <motion.div
          ref={carouselRef}
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportTrigger}
          className="flex gap-6 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory"
        >
          {displayDestinations.map((d) => (
            <motion.div
              key={d.id}
              variants={staggerItem}
              className="min-w-[300px] sm:min-w-[340px] max-w-[360px] snap-start flex-shrink-0"
            >
              <DestinationCard
                id={d.id}
                name={d.name}
                state={d.state}
                country={d.country}
                description={d.description}
                imageUrl={d.imageUrl}
                averageBudget={d.averageBudget}
                bestTimeToVisit={d.bestTimeToVisit}
                isPopular={d.isPopular}
                onExplore={handleDestinationExplore}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 5. WHY WAYRIVO AI */}
      <section className="py-24 bg-surface/40 border-y border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportTrigger}
            className="text-center mb-16"
          >
            <Badge variant="turquoise" size="sm" icon={<Zap className="w-3.5 h-3.5 text-teal-300" />}>
              Next-Gen Architecture
            </Badge>
            <h2 className="section-title mt-2">Why WayRivo AI 2.0</h2>
            <p className="section-subtitle mx-auto">
              Combining autonomous artificial intelligence with verified human agency expertise
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportTrigger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                icon: Bot,
                title: 'AI-Powered Planning',
                desc: 'Gemini multimodal agents evaluate travel logistics, weather, and traveler intent to structure optimal day-by-day journeys.',
                color: 'text-cyan-400',
                border: 'hover:border-cyan-500/50',
              },
              {
                icon: TrendingUp,
                title: 'Intelligent Budget Optimisation',
                desc: 'Real-time allocation across flights, stays, dining, and activities with algorithmic recommendations to maximize savings.',
                color: 'text-teal-400',
                border: 'hover:border-teal-500/50',
              },
              {
                icon: Layers,
                title: 'Personalised Itineraries',
                desc: 'Every trip request is matched with certified on-ground specialists who fine-tune activities to your family or group style.',
                color: 'text-amber-400',
                border: 'hover:border-amber-500/50',
              },
              {
                icon: CreditCard,
                title: 'Secure PayPal Checkout',
                desc: 'Client-authorized orders captured server-side and safely held in WayRivo Escrow until you return home satisfied.',
                color: 'text-cyan-300',
                border: 'hover:border-cyan-400/50',
              },
            ].map(({ icon: Icon, title, desc, color, border }) => (
              <motion.div
                key={title}
                variants={staggerItem}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
                className={`p-6 sm:p-7 rounded-3xl bg-surface/90 border border-border/80 ${border} transition-colors duration-300 hover:shadow-xl hover:shadow-cyan-500/10 flex flex-col justify-between`}
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5">
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 tracking-tight">
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 6. HOW IT WORKS: 4 ILLUSTRATED STEPS */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportTrigger}
          className="text-center mb-16"
        >
          <Badge variant="cyan" size="sm" icon={<HeartHandshake className="w-3.5 h-3.5 text-cyan-400" />}>
            Seamless Workflow
          </Badge>
          <h2 className="section-title mt-2">How It Works</h2>
          <p className="section-subtitle mx-auto">
            From initial intent to unforgettable memories in four clear stages
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportTrigger}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 relative"
        >
          {[
            {
              step: '01',
              title: 'Discover',
              subtitle: 'Find Inspiration',
              desc: 'Explore destinations or prompt our AI search bar with your group size, departure city, and target budget.',
            },
            {
              step: '02',
              title: 'Plan',
              subtitle: 'AI & Expert Synthesis',
              desc: 'Receive AI-structured itineraries while certified regional agencies submit competing, all-inclusive packages.',
            },
            {
              step: '03',
              title: 'Book',
              subtitle: 'PayPal Escrow Lock',
              desc: 'Accept your favorite proposal. Authorize payment through PayPal Sandbox; funds stay safe in escrow.',
            },
            {
              step: '04',
              title: 'Travel',
              subtitle: '24/7 Supported Journey',
              desc: 'Travel with confirmed vouchers and dedicated specialist support. Escrow funds disburse upon trip completion.',
            },
          ].map(({ step, title, subtitle, desc }) => (
            <motion.div
              key={step}
              variants={staggerItem}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25 }}
              className="group p-6 rounded-3xl bg-surface/80 border border-border/80 hover:border-cyan-500/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <span className="text-4xl font-black font-mono text-slate-600 group-hover:text-cyan-400 transition-colors">
                  {step}
                </span>
                <h3 className="text-xl font-bold text-white mt-4 tracking-tight group-hover:text-cyan-300 transition-colors">
                  {title}
                </h3>
                <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mt-0.5">
                  {subtitle}
                </p>
                <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
                  {desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 7. POPULAR TRAVEL PACKAGES */}
      <section id="packages" className="py-24 bg-surface/40 border-y border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportTrigger}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8"
          >
            <div>
              <Badge variant="gold" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}>
                Curated Packages
              </Badge>
              <h2 className="section-title mt-2">Popular Travel Packages</h2>
              <p className="section-subtitle">
                Complete all-inclusive packages designed and fulfilled by licensed specialist agencies
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {['All', 'Heritage & Luxury', 'Backwaters', 'Adventure', 'Beach'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-surface border border-border-light text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportTrigger}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredPackages.map((pkg) => (
              <motion.div key={pkg.id} variants={staggerItem}>
                <PackageCard
                  id={pkg.id}
                  title={pkg.title}
                  expertName={pkg.expertName}
                  organizationName={pkg.organizationName}
                  expertRating={pkg.expertRating}
                  expertReviews={pkg.expertReviews}
                  durationDays={pkg.durationDays}
                  totalPrice={pkg.totalPrice}
                  pricePerPerson={pkg.pricePerPerson}
                  currency={pkg.currency}
                  inclusions={pkg.inclusions}
                  cancellationPolicy={pkg.cancellationPolicy}
                  isRecommended={pkg.isRecommended}
                  onSelect={handlePackageSelect}
                  onViewDetails={handlePackageSelect}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 8. AI TRAVEL ASSISTANT PROMOTION */}
      <AIAssistantPromotion />

      {/* 9. TESTIMONIALS */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewportTrigger}
          className="text-center mb-16"
        >
          <Badge variant="cyan" size="sm" icon={<Star className="w-3.5 h-3.5 text-cyan-400" />}>
            Verified Traveler Experiences & Reviews
          </Badge>
          <h2 className="section-title mt-2">What Travelers Experience</h2>
          <p className="section-subtitle mx-auto">
            Discover how WayRivo AI orchestrates bespoke itineraries with verified local specialists and escrow protection
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportTrigger}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {sampleTestimonials.map((t, idx) => (
            <motion.div
              key={idx}
              variants={staggerItem}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25 }}
              className="card p-6 flex flex-col justify-between hover:border-cyan-500/30 transition-colors"
            >
              <div>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border/80">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{t.name}</h4>
                  <p className="text-[10px] text-cyan-400 font-medium">{t.destination}</p>
                  <p className="text-[10px] text-slate-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 11. FAQ ACCORDION SECTION */}
      <FAQSection />

      {/* 10. CALL TO ACTION SECTION */}
      <section className="py-24 relative overflow-hidden bg-gradient-to-b from-navy to-navy-dark border-t border-border/80">
        <div className="absolute inset-0 bg-radial-gradient from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

        <motion.div
          variants={scaleReveal}
          initial="hidden"
          whileInView="visible"
          viewport={viewportTrigger}
          className="max-w-4xl mx-auto px-4 text-center relative z-10"
        >
          <Badge variant="cyan" size="sm" glow icon={<Lock className="w-3.5 h-3.5 text-cyan-400" />}>
            100% Escrow Protection with PayPal Sandbox
          </Badge>

          <h2 className="text-3xl sm:text-5xl font-black text-white mt-4 tracking-tight font-heading">
            Your next adventure starts here.
          </h2>

          <p className="text-slate-300 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
            Generate your personalized itinerary, receive verified agency bids, and pay with confidence through secure PayPal authorization.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link to="/traveler/create-trip">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Start Your Journey with AI
              </Button>
            </Link>

            <Link to="/explore">
              <Button variant="secondary" size="lg">
                Explore Travel Marketplace
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default HomePage;
