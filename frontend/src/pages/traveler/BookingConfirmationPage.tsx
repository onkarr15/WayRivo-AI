import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Printer,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Hotel,
  Compass,
  FileText,
  User,
  Info,
  DollarSign,
  MapPin,
  Calendar,
  PlaneTakeoff,
  PlaneLanding,
  Users,
  Clock,
  Sparkles,
  Award,
  Receipt,
} from 'lucide-react';
import { bookingService, paymentService, itineraryIntelligenceService, proposalService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import PayPalCheckoutButton from '../../components/payment/PayPalCheckoutButton';

const BookingConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [payPalConfig, setPayPalConfig] = useState<any>(null);

  // Traveler Details Form State
  const [primaryTraveler, setPrimaryTraveler] = useState<string>(user?.name || '');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [phone, setPhone] = useState<string>('+91 98765 43210');
  const [emergencyContact, setEmergencyContact] = useState<string>('+91 98765 00000');
  const [specialRequests, setSpecialRequests] = useState<string>('Non-smoking room, vegetarian meal preference.');
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);

  // Fetch PayPal Config on mount
  useEffect(() => {
    paymentService
      .getConfig()
      .then((res) => setPayPalConfig(res.data?.data))
      .catch((err) => console.error('Failed to load PayPal config:', err));
  }, []);

  // Fetch Booking or create from Itinerary
  const fetchBookingOrItinerary = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 1. Try to fetch as an existing booking
      const bRes = await bookingService.getById(id);
      if (bRes.data?.data) {
        setBooking(bRes.data.data);
        setLoading(false);
        return;
      }
    } catch {
      // 2. If not a booking, try fetching as an itinerary and generate a pending booking
      try {
        const itinRes = await itineraryIntelligenceService.getById(id);
        const itin = itinRes.data?.data;
        if (itin) {
          // Create pending booking from itinerary
          const newBookingRes = await bookingService.create({
            itineraryId: itin.id,
            specialRequests: `Itinerary: ${itin.title}. Travelers: ${itin.travelersCount}`,
          });
          setBooking(newBookingRes.data?.data);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Not an itinerary ID, checking proposal resolution:', err);
      }

      // 3. If not an itinerary, check if it's a proposal ID
      try {
        const propRes = await proposalService.getById(id);
        const propData = propRes.data?.data;
        if (propData) {
          const selectRes = await proposalService.select(id);
          const bookingId = selectRes.data?.data?.bookingId || selectRes.data?.data?.id;
          if (bookingId) {
            const bRes2 = await bookingService.getById(bookingId);
            if (bRes2.data?.data) {
              setBooking(bRes2.data.data);
              setLoading(false);
              return;
            }
          }
        }
      } catch (propErr) {
        console.error('Failed to resolve proposal for booking reservation:', propErr);
      }
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchBookingOrItinerary();
  }, [fetchBookingOrItinerary]);

  const handlePayPalSuccess = (captureData: any) => {
    const paymentId = captureData.payment?.id || captureData.captureId || booking?.id;
    fetchBookingOrItinerary();
    navigate(`/payment/success?paymentId=${paymentId}&bookingId=${booking?.id}&orderId=${captureData.payment?.paypalOrderId || ''}`);
  };

  const handlePrint = () => {
    if (isPaid) {
      navigate(`/payment/success?bookingId=${booking?.id}&paymentId=${booking?.payment?.id || booking?.payment?.paypalCaptureId || ''}&autoPrint=true`);
    } else {
      window.print();
    }
  };

  const isPaid = Boolean(
    booking && (
      booking.status === 'CONFIRMED' ||
      booking.status === 'ESCROW_HOLD' ||
      booking.payment?.status === 'CAPTURED'
    )
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Booking Not Found</h2>
        <p className="text-sm text-slate-400 mb-6">
          We could not locate this reservation or itinerary. Please check your bookings list.
        </p>
        <Link
          to="/traveler/bookings"
          className="inline-flex px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
        >
          View My Bookings
        </Link>
      </div>
    );
  }

  const exchangeRate = payPalConfig?.exchangeRate || 83.5;
  const chargeCurrency = payPalConfig?.currency || 'USD';
  const totalInr = Number(booking.totalAmount || 0);
  const totalCharge = (totalInr / exchangeRate).toFixed(2);

  // Extract comprehensive trip details
  const getTripDetails = () => {
    if (!booking) return null;
    const reqText = booking.specialRequests || '';
    const fromMatch = reqText.match(/\[FROM:(.*?)\]/);
    const destMatch = reqText.match(/\[DEST:(.*?)\]/);
    const locMatch = reqText.match(/\[LOC:(.*?)\]/);
    const expertMatch = reqText.match(/\[EXPERT:(.*?)\]/);

    const departureLocation = booking.departureLocation || (fromMatch ? fromMatch[1] : 'Mumbai (BOM)');
    const destinationTitle = booking.tripDestination || (destMatch ? destMatch[1] : (booking.itinerary?.title || 'Kerala Backwaters & Munnar Tea Trails'));
    const destinationLocation = booking.destinationLocation || (locMatch ? locMatch[1] : (
      booking.itinerary?.destination
        ? `${booking.itinerary.destination.name}, ${booking.itinerary.destination.state ? `${booking.itinerary.destination.state}, ` : ''}${booking.itinerary.destination.country || 'India'}`
        : 'Kerala, India'
    ));
    const expertDetails = booking.expertDetails || (expertMatch ? expertMatch[1] : 'Vikram Singh Rathore • Royal Kerala Luxury Journeys');

    const refTime = booking?.createdAt ? new Date(booking.createdAt).getTime() : 0;
    const startDate = booking.itinerary?.startDate
      ? new Date(booking.itinerary.startDate)
      : new Date(refTime + 14 * 86400000);
    const endDate = booking.itinerary?.endDate
      ? new Date(booking.itinerary.endDate)
      : new Date(refTime + 20 * 86400000);

    const totalDays = booking.itinerary?.numberOfDays || 6;
    const totalNights = Math.max(1, totalDays - 1);
    const travelersCount = booking.itinerary?.travelersCount || 2;
    const travelStyle = booking.itinerary?.travelStyle || 'Luxury Heritage & Wellness';
    const totalAmount = Number(booking.totalAmount || 0);
    const perPersonAmount = Math.round(totalAmount / travelersCount);
    const itineraryDays = booking.itinerary?.days || [];

    return {
      departureLocation,
      destinationTitle,
      destinationLocation,
      expertDetails,
      startDate,
      endDate,
      totalDays,
      totalNights,
      travelersCount,
      travelStyle,
      totalAmount,
      perPersonAmount,
      itineraryDays,
    };
  };

  const trip = getTripDetails();

  return (
    <div className="max-w-5xl mx-auto pt-24 pb-20 px-4 sm:px-6 print:pt-4 print:pb-4 print:px-0 print:max-w-none print:w-full">
      {/* 1. Status Header */}
      <div className="text-center mb-8 print:mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 mb-3 print:hidden">
          <ShieldCheck className="w-4 h-4 text-cyan-400" /> PayPal Developer Sandbox Protected
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight print:text-2xl print:text-slate-900">
          {isPaid ? 'Booking Confirmed & Escrow Secured' : 'Booking Reservation Summary'}
        </h1>

        <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
          {isPaid
            ? 'Your journey is confirmed and protected by WayRivo Escrow.'
            : 'Review your bespoke itinerary and traveler details to complete payment via PayPal Sandbox.'}
        </p>

        <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
          Booking Reference: <span className="font-mono font-bold text-cyan-400 print:text-slate-900">{booking.bookingReference}</span>
        </p>
      </div>

      {/* 2. Main Card */}
      <div className="p-6 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4 print:border-slate-300">
          <div>
            <div className="flex items-center gap-1.5 text-2xl font-black tracking-wider text-white print:text-slate-900">
              WAY<span className="text-gradient-cyan">RIVO</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 print:hidden">
                AI 2.0
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Intelligent Travel Commerce & Escrow Engine</p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs text-slate-400 block print:text-slate-600">
              Booking Date: {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span
              className={`inline-block mt-1 px-3 py-1 rounded-full text-[11px] font-extrabold uppercase ${
                isPaid
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isPaid ? 'ESCROW DEPOSITED (CONFIRMED)' : 'PENDING PAYMENT'}
            </span>
          </div>
        </div>

        {/* 2.5 Prominent Route & Departure / Destination Banner */}
        {trip && (
          <div className="my-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-cyan-500/30 p-5 sm:p-6 shadow-xl print:border-slate-300 print:bg-slate-50">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Departure Location & Starting Date */}
              <div className="flex items-center gap-3.5 w-full md:w-auto">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <PlaneTakeoff className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 block print:text-slate-600">
                    Departure Location
                  </span>
                  <h3 className="text-lg font-black text-white tracking-tight print:text-black">
                    {trip.departureLocation}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5 print:text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      Start: {trip.startDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Transit Flight / Distance Divider */}
              <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-auto px-4">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 tracking-wider uppercase mb-1.5">
                  {trip.totalDays} Days • {trip.totalNights} Nights
                </span>
                <div className="flex items-center gap-2 w-full max-w-[200px]">
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-cyan-500/20 to-cyan-500"></div>
                  <PlaneLanding className="w-4 h-4 text-cyan-400 rotate-45" />
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-cyan-500 to-teal-500/20"></div>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                  Escrow Verified Transit
                </span>
              </div>

              {/* Destination Location & Return Date */}
              <div className="flex items-center gap-3.5 w-full md:w-auto md:text-right md:flex-row-reverse">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400 block print:text-slate-600">
                    Destination Location
                  </span>
                  <h3 className="text-lg font-black text-white tracking-tight print:text-black">
                    {trip.destinationLocation}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-0.5 md:justify-end print:text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <span>
                      Return: {trip.endDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-bar: Trip Title & Specialist */}
            <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 print:border-slate-300">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-white print:text-black">
                  Trip: {trip.destinationTitle}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                <span>Specialist: <strong className="text-cyan-300 print:text-black">{trip.expertDetails}</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* 2.6 Detailed 4-Grid Trip Breakdown */}
        {trip && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
            {/* Tile 1: Starting Date & Duration */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 print:border-slate-300 print:bg-white">
              <div className="flex items-center gap-2 text-cyan-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-600">Starting Date</span>
              </div>
              <div className="text-sm font-black text-white print:text-black">
                {trip.startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Through {trip.endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ({trip.totalDays} Days)
              </p>
            </div>

            {/* Tile 2: Departure Location */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 print:border-slate-300 print:bg-white">
              <div className="flex items-center gap-2 text-cyan-400 mb-1">
                <PlaneTakeoff className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-600">Departure Location</span>
              </div>
              <div className="text-sm font-black text-white print:text-black">
                {trip.departureLocation}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Origin city & verified departure point
              </p>
            </div>

            {/* Tile 3: Destination Location */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 print:border-slate-300 print:bg-white">
              <div className="flex items-center gap-2 text-teal-400 mb-1">
                <Compass className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 print:text-slate-600">Destination Location</span>
              </div>
              <div className="text-sm font-black text-white print:text-black">
                {trip.destinationLocation}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {trip.destinationTitle}
              </p>
            </div>

            {/* Tile 4: Total Trip Amount */}
            <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 print:border-slate-300 print:bg-white">
              <div className="flex items-center gap-2 text-cyan-400 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 print:text-slate-600">Total Trip Amount</span>
              </div>
              <div className="text-base font-black text-cyan-300 print:text-black">
                ₹{trip.totalAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                ₹{trip.perPersonAmount.toLocaleString('en-IN')} / person ({trip.travelersCount} travelers)
              </p>
            </div>
          </div>
        )}

        {/* 2.7 Day-by-Day Travel Schedule Breakdown */}
        {trip && trip.itineraryDays && trip.itineraryDays.length > 0 && (
          <div className="my-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> Day-by-Day Journey Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {trip.itineraryDays.map((d: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs print:border-slate-300 print:bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                      Day {d.dayNumber || idx + 1}
                    </span>
                    {d.estimatedDayCost && (
                      <span className="text-[11px] font-bold text-slate-300">
                        ₹{Number(d.estimatedDayCost).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white print:text-black mb-1 line-clamp-1">{d.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed print:text-slate-700">{d.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Review Selected Services & Line Items */}
        <div className="my-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Selected Services & Verified Inventory
          </h3>

          <div className="rounded-2xl bg-slate-950/70 border border-slate-800/80 overflow-hidden print:border-slate-300 print:bg-white">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between print:border-slate-300">
              <div>
                <h4 className="text-sm font-bold text-white print:text-slate-900">
                  {booking.itinerary?.title || 'Custom Curated Vacation Package'}
                </h4>
                <p className="text-xs text-slate-400 print:text-slate-600">
                  {booking.itinerary?.numberOfDays || 5} Days • {booking.itinerary?.travelersCount || 2} Travelers • {booking.itinerary?.travelStyle || 'COMFORT'}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase print:text-slate-600">Server-Verified Total</span>
                <span className="text-base font-black text-cyan-300 print:text-slate-900">
                  ₹{totalInr.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Itemized Line Items */}
            {booking.items && booking.items.length > 0 && (
              <div className="divide-y divide-slate-800/60 text-xs">
                {booking.items.map((item: any, idx: number) => (
                  <div key={idx} className="p-3.5 flex items-center justify-between text-slate-300">
                    <div className="flex items-center gap-2">
                      {item.itemType === 'HOTEL' ? (
                        <Hotel className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Compass className="w-4 h-4 text-teal-400" />
                      )}
                      <div>
                        <span className="font-semibold text-white print:text-slate-900">{item.title}</span>
                        {item.notes && <p className="text-[11px] text-slate-400">{item.notes}</p>}
                      </div>
                    </div>

                    <div className="text-right font-medium">
                      <span>₹{Number(item.totalPrice).toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-slate-400 block">
                        ₹{Number(item.unitPrice).toLocaleString('en-IN')} × {item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 4. Traveler Details Form (Editable before payment) */}
        {!isPaid ? (
          <div className="my-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <User className="w-4 h-4" /> Traveler Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Primary Traveler Full Name
                </label>
                <input
                  type="text"
                  value={primaryTraveler}
                  onChange={(e) => setPrimaryTraveler(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Arjun Sharma"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="arjun@example.com"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Emergency Contact</label>
                <input
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="+91 98765 00000"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Special Requests / Dietary Preferences / Arrival Notes
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Vegetarian diet, high floor preference, airport taxi arrival time"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Printable Traveler Info when Paid */
          <div className="my-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Traveler</span>
              <span className="font-bold text-white print:text-black">{booking.user?.name || primaryTraveler}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Contact</span>
              <span className="font-semibold text-slate-200 print:text-black">{booking.user?.email || email}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Escrow Status</span>
              <span className="font-bold text-emerald-400 print:text-black">HELD IN ESCROW</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase block">Payment Method</span>
              <span className="font-semibold text-slate-200 print:text-black">PayPal Sandbox</span>
            </div>
          </div>
        )}

        {/* 5. Currency Conversion & Sandbox Price Breakdown Box */}
        <div className="my-6 p-5 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 text-xs space-y-3 print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              <h4 className="font-bold text-cyan-300">PayPal Sandbox Multi-Currency Engine</h4>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Live Exchange Rate
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-cyan-900/40">
            <div>
              <span className="text-slate-400">Application Display Currency:</span>
              <span className="font-black text-white ml-2 text-sm">₹{totalInr.toLocaleString('en-IN')} INR</span>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-slate-400">PayPal Sandbox Charge Amount:</span>
              <span className="font-black text-cyan-300 ml-2 text-base">
                ${totalCharge} {chargeCurrency}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            * Note: WayRivo displays Indian Rupees (INR) for local convenience. PayPal Developer Sandbox processes international orders in <strong>{chargeCurrency}</strong> at a conversion rate of 1 {chargeCurrency} = ₹{exchangeRate} INR.
          </p>
        </div>

        {/* 6. Cancellation Conditions Accordion */}
        <div className="my-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-3 print:hidden">
          <div className="flex items-center gap-2 text-white font-bold">
            <Info className="w-4 h-4 text-cyan-400" />
            <span>Cancellation Policy & Escrow Terms</span>
          </div>

          <ul className="list-disc pl-5 text-slate-400 text-[11px] space-y-1">
            <li>
              <strong>100% Escrow Protection:</strong> Funds are locked securely in PayPal Escrow until 14 days after departure or service completion.
            </li>
            <li>
              <strong>Free Cancellation:</strong> Full refund eligible if cancelled at least 7 days before your departure date.
            </li>
            <li>
              <strong>Administrative Review:</strong> Cancellations submit an escrow release request for administrator audit. Refunds are processed through the PayPal Refund API directly to your original payment method.
            </li>
          </ul>

          {!isPaid && (
            <label className="flex items-center gap-2.5 pt-2 text-xs font-semibold text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
              />
              <span>I have reviewed the cancellation conditions and accept the WayRivo booking terms.</span>
            </label>
          )}
        </div>

        {/* 7. PayPal Checkout Execution */}
        {!isPaid ? (
          <div className="my-6 print:hidden">
            <PayPalCheckoutButton
              bookingId={booking.id}
              amount={booking.totalAmount}
              currency={booking.currency || 'INR'}
              chargeAmount={totalCharge}
              chargeCurrency={chargeCurrency}
              disabled={!termsAgreed || !primaryTraveler || !phone}
              onSuccess={handlePayPalSuccess}
              onCancel={() => {
                toast.info('Payment was cancelled. You can retry anytime.');
              }}
              onError={(err) => {
                console.error('PayPal checkout error:', err);
              }}
            />
          </div>
        ) : (
          /* Verified Escrow Receipt Badge */
          <div className="my-6 p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>PayPal Escrow Verification Receipt</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer shadow"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </button>
                <Link
                  to={`/payment/details/${booking.payment?.id || booking.payment?.paypalCaptureId || booking.id}`}
                  className="px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Receipt className="w-3.5 h-3.5" /> Details
                </Link>
                <Link
                  to={`/payment/success?bookingId=${booking.id}&paymentId=${booking.payment?.id || booking.payment?.paypalCaptureId || ''}`}
                  className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  Confirmation Screen
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-slate-300">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">PayPal Order ID</span>
                <span className="font-mono text-white text-xs">{booking.payment?.paypalOrderId || 'ORD-VERIFIED'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">PayPal Capture ID</span>
                <span className="font-mono text-cyan-300 text-xs">{booking.payment?.paypalCaptureId || 'CAP-VERIFIED'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Escrow Release Date</span>
                <span className="text-slate-200 text-xs">
                  {booking.escrowReleaseDate
                    ? new Date(booking.escrowReleaseDate).toLocaleDateString('en-IN')
                    : 'Post Journey Completion'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-emerald-300/80 leading-relaxed pt-1">
              Your payment of ₹{totalInr.toLocaleString('en-IN')} (~ ${totalCharge} {chargeCurrency}) is confirmed and held in WayRivo Escrow. In accordance with platform integrity rules, funds are only released to travel providers upon successful trip delivery.
            </p>
          </div>
        )}

        {/* 8. Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800 print:hidden">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> {isPaid ? 'Print / Save PDF Receipt' : 'Print Booking Summary'}
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/traveler/bookings"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20"
            >
              View in My Bookings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmationPage;
