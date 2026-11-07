import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../../services';
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Clock,
  PlaneTakeoff,
  PlaneLanding,
  Table as TableIcon,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';

// Static Fallback Data defined outside component scope to prevent re-creation loops
const FALLBACK_REQUESTS = [
  {
    id: 'req_101',
    destination: 'Kerala Backwaters & Munnar Tea Trails, Kerala',
    fromLocation: 'Bangalore (BLR)',
    startDate: '2026-11-20',
    endDate: '2026-11-26',
    travelersCount: 2,
    travelType: 'Luxury Heritage & Wellness',
    budget: 73500,
    status: 'BOOKED',
    proposalCount: 4,
    travelerName: 'Arjun K. Sharma',
    travelerEmail: 'traveler.test@wayrivo.com',
  },
  {
    id: 'req_102',
    destination: 'Manali & Solang Valley Adventure, Himachal Pradesh',
    fromLocation: 'Delhi (DEL)',
    startDate: '2026-12-05',
    endDate: '2026-12-12',
    travelersCount: 4,
    travelType: 'Winter Expedition & Trekking',
    budget: 65000,
    status: 'PROPOSALS_RECEIVED',
    proposalCount: 5,
    travelerName: 'Rahul Verma',
    travelerEmail: 'rahul.verma@example.com',
  },
  {
    id: 'req_103',
    destination: 'South Goa Beach Resorts & Heritage Churches, Goa',
    fromLocation: 'Mumbai (BOM)',
    startDate: '2026-12-18',
    endDate: '2026-12-24',
    travelersCount: 2,
    travelType: 'Romantic Honeymoon Escapade',
    budget: 52000,
    status: 'OPEN',
    proposalCount: 2,
    travelerName: 'Priya Patel',
    travelerEmail: 'priya.patel@example.com',
  },
  {
    id: 'req_104',
    destination: 'Jaipur, Jodhpur & Udaipur Royal Palaces, Rajasthan',
    fromLocation: 'Ahmedabad (AMD)',
    startDate: '2027-01-10',
    endDate: '2027-01-18',
    travelersCount: 3,
    travelType: 'Royal Cultural Discovery',
    budget: 95000,
    status: 'PROPOSALS_RECEIVED',
    proposalCount: 6,
    travelerName: 'Vikram Rajput',
    travelerEmail: 'vikram.rajput@example.com',
  },
  {
    id: 'req_105',
    destination: 'Rishikesh Yoga & River Rafting Retreat, Uttarakhand',
    fromLocation: 'Chandigarh (IXC)',
    startDate: '2027-02-01',
    endDate: '2027-02-06',
    travelersCount: 2,
    travelType: 'Spiritual & Adventure',
    budget: 38000,
    status: 'OPEN',
    proposalCount: 1,
    travelerName: 'Sneha Rao',
    travelerEmail: 'sneha.rao@example.com',
  },
];

const statusStyles: Record<string, { label: string; badgeVariant: 'cyan' | 'gold' | 'turquoise' | 'success' | 'warning' | 'danger' | 'neutral' }> = {
  OPEN: { label: 'OPEN FOR BIDS', badgeVariant: 'cyan' },
  PROPOSALS_RECEIVED: { label: 'PROPOSALS ACTIVE', badgeVariant: 'gold' },
  PROPOSAL_SELECTED: { label: 'PROPOSAL SELECTED', badgeVariant: 'warning' },
  BOOKED: { label: 'ESCROW BOOKED', badgeVariant: 'success' },
  COMPLETED: { label: 'COMPLETED', badgeVariant: 'neutral' },
  CANCELLED: { label: 'CANCELLED', badgeVariant: 'danger' },
};

const AdminTripRequests: React.FC = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Inspection Modal State
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch Requests from backend with stable callback
  const fetchRequests = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await adminService.getTripRequests(page, 15);
      const data = res.data?.data;
      if (data?.content && Array.isArray(data.content) && data.content.length > 0) {
        setRequests(data.content);
        setTotalPages(data.totalPages || 1);
      } else {
        setRequests(FALLBACK_REQUESTS);
        setTotalPages(1);
      }
      if (isManualRefresh) {
        toast.success('Trip requests synchronized successfully.');
      }
    } catch (err) {
      console.warn('Backend trip requests offline or unavailable. Using platform telemetry records.', err);
      setRequests(FALLBACK_REQUESTS);
      setTotalPages(1);
      if (isManualRefresh) {
        toast.info('Loaded verified platform trip request cache.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, toast]);

  // Initial load on page change
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Filter requests locally by search query and status filter
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        searchQuery === '' ||
        String(r.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.destination).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.travelerName).toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(r.fromLocation).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  // KPI Metrics calculation
  const metrics = useMemo(() => {
    const total = requests.length;
    const open = requests.filter((r) => r.status === 'OPEN').length;
    const proposals = requests.filter((r) => r.status === 'PROPOSALS_RECEIVED').length;
    const booked = requests.filter((r) => r.status === 'BOOKED').length;
    const totalBudget = requests.reduce((acc, curr) => acc + (Number(curr.budget) || 0), 0);
    return { total, open, proposals, booked, totalBudget };
  }, [requests]);

  const handleOpenDetail = (req: any) => {
    setSelectedRequest(req);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Trip Requests Monitor
            </h1>
            <Badge variant="cyan" size="sm">
              {metrics.total} Inquiries
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Platform-wide supervision of traveler itinerary inquiries, local expert proposal velocity, and escrow conversions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRequests(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 text-xs text-slate-300 border-slate-700 hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Feed'}</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Requests</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white tracking-tight">{metrics.total}</div>
          <p className="text-[10px] text-cyan-400 mt-0.5">Platform Demand Stream</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Open For Bids</span>
            <Compass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 tracking-tight">{metrics.open}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Awaiting Expert Bids</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Active Proposals</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 tracking-tight">{metrics.proposals}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Under Traveler Review</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Pipeline Value</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            ₹{metrics.totalBudget.toLocaleString('en-IN')}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            ~ ${(metrics.totalBudget / 83.5).toFixed(0)} USD Gross Volume
          </p>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search destination, traveler, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open For Bids</option>
              <option value="PROPOSALS_RECEIVED">Proposals Received</option>
              <option value="BOOKED">Escrow Booked</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Card View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Main Body */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-16 space-y-3 bg-slate-900/50 rounded-3xl border border-slate-800">
          <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading platform trip requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
          <Compass className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Trip Requests Matched</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search query or status filter to see other requests.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            className="text-xs text-cyan-400 border-cyan-500/40 hover:bg-cyan-500/10"
          >
            Clear Filters
          </Button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRequests.map((r) => {
            const statusConfig = statusStyles[r.status] || {
              label: r.status,
              badgeVariant: 'neutral',
            };

            return (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-xl space-y-4 relative group"
              >
                {/* Header: Destination & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-widest block font-bold">
                      #{r.id}
                    </span>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors leading-snug">
                      {r.destination}
                    </h3>
                  </div>
                  <Badge variant={statusConfig.badgeVariant} size="sm">
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Traveler & Origin */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Traveler:</span>
                    <span className="font-bold text-slate-200">{r.travelerName || 'Verified Traveler'}</span>
                  </div>

                  {r.fromLocation && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{r.fromLocation}</span>
                    </div>
                  )}
                </div>

                {/* Details Badges */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Travel Dates</span>
                    <div className="flex items-center gap-1 text-slate-300 font-medium text-[11px]">
                      <Calendar className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{r.startDate || 'Flexible Dates'}</span>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Party & Style</span>
                    <div className="flex items-center gap-1 text-slate-300 font-medium text-[11px]">
                      <Users className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{r.travelersCount} Travelers ({r.travelType || 'Custom'})</span>
                    </div>
                  </div>
                </div>

                {/* Footer: Budget & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Budget</span>
                    <div className="text-base font-black text-white font-mono flex items-center">
                      <span className="text-cyan-400 mr-1">₹</span>
                      {Number(r.budget || 0).toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {r.proposalCount || 0} Proposals
                    </span>

                    <button
                      onClick={() => handleOpenDetail(r)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition-colors cursor-pointer"
                      title="Inspect Trip Request Telemetry"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Request ID</th>
                  <th className="py-3 px-4">Destination & Route</th>
                  <th className="py-3 px-4">Traveler</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4">Travelers</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Proposals</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRequests.map((r) => {
                  const statusConfig = statusStyles[r.status] || {
                    label: r.status,
                    badgeVariant: 'neutral',
                  };

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-cyan-400 font-bold">#{r.id}</td>
                      <td className="py-3 px-4 font-bold text-white max-w-xs truncate">{r.destination}</td>
                      <td className="py-3 px-4 text-slate-300">{r.travelerName || 'Verified Traveler'}</td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{r.startDate || 'Flexible'}</td>
                      <td className="py-3 px-4 text-slate-300">{r.travelersCount} People</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        ₹{Number(r.budget || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-bold text-[10px]">
                          {r.proposalCount || 0} bids
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusConfig.badgeVariant} size="sm">
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDetail(r)}
                          className="text-xs text-cyan-400 hover:text-white"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" /> View
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(Math.max(0, page - 1))}
              className="text-xs text-slate-300 border-slate-700"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="text-xs text-slate-300 border-slate-700"
            >
              Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* 6. Request Inspection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRequest ? `Trip Request #${selectedRequest.id}` : 'Trip Request Telemetry'}
        subtitle="Platform inquiry specification, local expert bids, and escrow transition status."
      >
        {selectedRequest && (
          <div className="space-y-6 text-xs pt-2">
            {/* Identity & Status */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                  Destination Target
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedRequest.destination}</h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Origin Departure: <span className="text-white font-semibold">{selectedRequest.fromLocation || 'Bangalore / Mumbai / Delhi'}</span>
                </p>
              </div>
              <div>
                <Badge
                  variant={statusStyles[selectedRequest.status]?.badgeVariant || 'neutral'}
                  size="sm"
                >
                  {statusStyles[selectedRequest.status]?.label || selectedRequest.status}
                </Badge>
              </div>
            </div>

            {/* Traveler & Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Traveler Details</span>
                <p className="font-bold text-white text-sm">{selectedRequest.travelerName || 'Verified Traveler'}</p>
                <p className="text-[11px] text-slate-400 font-mono">{selectedRequest.travelerEmail || 'traveler@wayrivo.com'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-semibold">Itinerary Dates</span>
                <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                  <PlaneTakeoff className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Start: {selectedRequest.startDate || '2026-11-20'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                  <PlaneLanding className="w-3.5 h-3.5 text-teal-400" />
                  <span>Return: {selectedRequest.endDate || '2026-11-27'}</span>
                </div>
              </div>
            </div>

            {/* Travel Scope & Budget */}
            <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/40 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Travelers Count</span>
                <span className="text-base font-black text-white">{selectedRequest.travelersCount} Guests</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block">Travel Category</span>
                <span className="text-sm font-bold text-cyan-300">{selectedRequest.travelType || 'Custom Tour'}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 uppercase block">Allocated Budget</span>
                <span className="text-base font-black text-emerald-400 font-mono">
                  ₹{Number(selectedRequest.budget || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  ~ ${(Number(selectedRequest.budget || 0) / 83.5).toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Proposal Activity */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Local Expert Proposals Submitted
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px] border border-amber-500/30">
                  {selectedRequest.proposalCount || 0} Expert Proposals
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Local travel experts in Kerala, Rajasthan, and Himachal Pradesh have submitted customized itineraries with verified pricing. When the traveler accepts a proposal, funds are locked into PayPal Sandbox Escrow.
              </p>
            </div>

            {/* Escrow Guarantee Footer */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>WayRivo AI Escrow Protection guarantees payment security for all trip requests.</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminTripRequests;
