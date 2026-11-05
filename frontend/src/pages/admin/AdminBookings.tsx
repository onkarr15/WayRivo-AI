import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService, paymentService } from '../../services';
import {
  Calendar,
  MapPin,
  ShieldCheck,
  RotateCcw,
  X,
  Search,
  Table,
  LayoutGrid,
  CreditCard,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { wayrivoAgGridTheme } from '../../utils/agGridTheme';
import { useToast } from '../../components/ui/Toast';

// Register AG Grid Community Modules
ModuleRegistry.registerModules([AllCommunityModule]);

const statusBadgeStyles: Record<string, string> = {
  CONFIRMED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  ESCROW_HOLD: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  PENDING_PAYMENT: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/30',
  REFUNDED: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
};

const AdminBookings: React.FC = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'cards'>('table');
  const [quickFilterText, setQuickFilterText] = useState('');

  // Refund Modal State
  const [selectedBookingForRefund, setSelectedBookingForRefund] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState<number>(0);
  const [refundReason, setRefundReason] = useState<string>('Approved cancellation by administrator');
  const [isProcessingRefund, setIsProcessingRefund] = useState<boolean>(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getBookings(page, 50);
      const data = res.data?.data;
      const list = data?.bookings || data?.content || (Array.isArray(data) ? data : []);
      setBookings(list);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load admin bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleExecuteRefund = async () => {
    if (!selectedBookingForRefund) return;
    setIsProcessingRefund(true);
    try {
      const res = await paymentService.processRefund({
        bookingId: selectedBookingForRefund.id,
        amount: refundAmount > 0 ? refundAmount : undefined,
        reason: refundReason,
      });

      toast.success(res.data?.data?.message || 'Refund successfully processed via PayPal Sandbox.');
      setSelectedBookingForRefund(null);
      fetchBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to process refund.');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  // Filtered bookings for Table view
  const filteredBookings = useMemo(() => {
    if (!quickFilterText) return bookings;
    const q = quickFilterText.toLowerCase();
    return bookings.filter((b) => {
      const ref = (b.bookingReference || '').toLowerCase();
      const userName = (b.user?.name || '').toLowerCase();
      const userEmail = (b.user?.email || '').toLowerCase();
      const destination = (b.itinerary?.title || b.itinerary?.destination?.name || '').toLowerCase();
      const captureId = (b.payment?.paypalCaptureId || '').toLowerCase();
      const status = (b.status || '').toLowerCase();
      return (
        ref.includes(q) ||
        userName.includes(q) ||
        userEmail.includes(q) ||
        destination.includes(q) ||
        captureId.includes(q) ||
        status.includes(q)
      );
    });
  }, [bookings, quickFilterText]);

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      field: 'bookingReference',
      headerName: 'Reference',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 160,
      cellClass: 'font-mono font-bold text-cyan-400',
    },
    {
      field: 'user.name',
      headerName: 'Traveler',
      sortable: true,
      filter: 'agTextColumnFilter',
      minWidth: 180,
      flex: 1,
      cellRenderer: (params: any) => {
        const u = params.data?.user;
        return (
          <div className="py-1">
            <span className="font-semibold text-white block truncate">{u?.name || 'Guest Traveler'}</span>
            <span className="text-[11px] text-slate-400 block truncate">{u?.email || 'N/A'}</span>
          </div>
        );
      },
    },
    {
      field: 'itinerary.title',
      headerName: 'Itinerary / Destination',
      sortable: true,
      filter: 'agTextColumnFilter',
      minWidth: 180,
      flex: 1.2,
      valueGetter: (params: any) =>
        params.data?.itinerary?.title || params.data?.itinerary?.destination?.name || 'Custom Booking',
      cellClass: 'text-slate-200 text-xs truncate',
    },
    {
      field: 'totalAmount',
      headerName: 'Amount',
      sortable: true,
      filter: 'agNumberColumnFilter',
      width: 130,
      valueFormatter: (params: any) => `₹${Number(params.value || 0).toLocaleString('en-IN')}`,
      cellClass: 'font-bold text-white font-mono',
    },
    {
      field: 'status',
      headerName: 'Status',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 140,
      cellRenderer: (params: any) => {
        const rawStatus = params.value || 'PENDING';
        const display = rawStatus === 'ESCROW_HOLD' ? 'Escrow Held' : rawStatus.replace(/_/g, ' ');
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
              statusBadgeStyles[rawStatus] || 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {display}
          </span>
        );
      },
    },
    {
      field: 'payment.escrowStatus',
      headerName: 'Escrow Status',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 140,
      cellRenderer: (params: any) => {
        const escrow = params.data?.payment?.escrowStatus || 'NONE';
        return (
          <span className="font-mono text-[10px] font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            {escrow}
          </span>
        );
      },
    },
    {
      field: 'payment.paypalCaptureId',
      headerName: 'PayPal Capture ID',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 170,
      cellClass: 'font-mono text-emerald-400 text-xs',
      valueGetter: (params: any) => params.data?.payment?.paypalCaptureId || '—',
    },
    {
      headerName: 'Refund Action',
      width: 160,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const b = params.data;
        if (!b) return null;
        const canRefund = (b.status === 'CONFIRMED' || b.status === 'ESCROW_HOLD') && !!b.payment;
        if (canRefund) {
          return (
            <button
              onClick={() => {
                setSelectedBookingForRefund(b);
                setRefundAmount(Number(b.totalAmount));
                setRefundReason('Administrator approved traveler refund request');
              }}
              className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 font-bold text-[11px] border border-purple-500/30 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Refund
            </button>
          );
        }
        if (b.status === 'REFUNDED') {
          return (
            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              Refunded
            </span>
          );
        }
        return <span className="text-slate-500 text-xs">—</span>;
      },
    },
  ], []);

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 mb-1">
            <CreditCard className="w-3.5 h-3.5 text-cyan-400" /> Financial Records & Escrow Settlements
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            All Bookings & <span className="text-gradient-cyan">Escrow Transactions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit active reservations, escrow deposits, and execute administrator-controlled PayPal refunds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 3 View Mode Toggle */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center gap-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" /> Table View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> AG Grid Pro
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all ${
                viewMode === 'cards'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Cards
            </button>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> PayPal Sandbox Active
          </span>
        </div>
      </div>

      {/* Filter and Quick Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={quickFilterText}
            onChange={(e) => setQuickFilterText(e.target.value)}
            placeholder="Search references, travelers, captures..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-semibold">
          {filteredBookings.length} reservations loaded
        </span>
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No reservations found matching your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Reference</th>
                    <th className="p-3.5">Traveler</th>
                    <th className="p-3.5">Itinerary / Destination</th>
                    <th className="p-3.5 text-right">Amount</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-center">Escrow</th>
                    <th className="p-3.5">Capture ID</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredBookings.map((b) => {
                    const rawStatus = b.status || 'PENDING';
                    const canRefund = (rawStatus === 'CONFIRMED' || rawStatus === 'ESCROW_HOLD') && !!b.payment;
                    const displayStatus = rawStatus === 'ESCROW_HOLD' ? 'Escrow Held' : rawStatus.replace(/_/g, ' ');

                    return (
                      <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Reference */}
                        <td className="p-3.5 font-mono font-bold text-cyan-400 whitespace-nowrap">
                          {b.bookingReference}
                        </td>

                        {/* Traveler */}
                        <td className="p-3.5">
                          <div className="leading-tight truncate max-w-[180px]">
                            <span className="font-semibold text-white block truncate">
                              {b.user?.name || 'Guest Traveler'}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate font-mono">
                              {b.user?.email || 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* Itinerary */}
                        <td className="p-3.5 text-slate-300 max-w-[200px] truncate">
                          {b.itinerary?.title || b.itinerary?.destination?.name || 'Custom Reservation'}
                        </td>

                        {/* Amount */}
                        <td className="p-3.5 text-right font-mono font-bold text-white whitespace-nowrap">
                          ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Status */}
                        <td className="p-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border whitespace-nowrap ${
                              statusBadgeStyles[rawStatus] || 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {displayStatus}
                          </span>
                        </td>

                        {/* Escrow */}
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="font-mono text-[10px] font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {b.payment?.escrowStatus || 'NONE'}
                          </span>
                        </td>

                        {/* Capture ID */}
                        <td className="p-3.5 font-mono text-[11px] text-emerald-400 whitespace-nowrap">
                          {b.payment?.paypalCaptureId || '—'}
                        </td>

                        {/* Action */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          {canRefund ? (
                            <button
                              onClick={() => {
                                setSelectedBookingForRefund(b);
                                setRefundAmount(Number(b.totalAmount));
                                setRefundReason('Administrator approved traveler refund request');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 font-bold text-[11px] border border-purple-500/30 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" /> Refund
                            </button>
                          ) : rawStatus === 'REFUNDED' ? (
                            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                              Refunded
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Page {page + 1} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: AG GRID PRO CONTAINER */}
      {viewMode === 'grid' && (
        <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-900">
          <div style={{ height: 520, width: '100%' }}>
            <AgGridReact
              theme={wayrivoAgGridTheme}
              rowData={filteredBookings}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              quickFilterText={quickFilterText}
              pagination={true}
              paginationPageSize={10}
              paginationPageSizeSelector={[10, 20, 50]}
              animateRows={true}
              rowHeight={48}
              headerHeight={44}
            />
          </div>
        </div>
      )}

      {/* VIEW 3: CARDS VIEW */}
      {viewMode === 'cards' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              No bookings recorded yet in the database.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((b: any) => {
                const rawStatus = b.status || 'CONFIRMED';
                const isConfirmedOrEscrow = rawStatus === 'CONFIRMED' || rawStatus === 'ESCROW_HOLD';
                const hasPayment = !!b.payment;

                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all shadow-md space-y-3"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="font-mono font-bold text-xs text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                            {b.bookingReference}
                          </span>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              statusBadgeStyles[rawStatus] || 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {rawStatus === 'ESCROW_HOLD' ? 'Escrow Held' : rawStatus.replace(/_/g, ' ')}
                          </span>

                          {b.payment?.paypalCaptureId && (
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              Capture: {b.payment.paypalCaptureId}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-white">
                          {b.itinerary?.title || `Reservation ${b.bookingReference}`}
                        </h3>

                        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            {b.itinerary?.destination?.name || 'India'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(b.createdAt).toLocaleDateString('en-IN')}
                          </span>
                          <span className="font-bold text-white text-sm font-mono">
                            ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex flex-wrap gap-4">
                          <span>👤 Traveler: <strong className="text-slate-200">{b.user?.name || 'Traveler'}</strong> ({b.user?.email})</span>
                          {b.payment && (
                            <span>💳 Escrow: <strong className="text-cyan-300">{b.payment.escrowStatus || 'HELD'}</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Admin Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isConfirmedOrEscrow && hasPayment && (
                          <button
                            onClick={() => {
                              setSelectedBookingForRefund(b);
                              setRefundAmount(Number(b.totalAmount));
                              setRefundReason('Administrator approved traveler refund request');
                            }}
                            className="px-3 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-950/70 text-purple-300 font-semibold text-xs border border-purple-500/30 flex items-center gap-1.5 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Process PayPal Refund
                          </button>
                        )}

                        {rawStatus === 'REFUNDED' && (
                          <span className="px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 text-xs font-bold border border-purple-500/20">
                            Refund Reconciled
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
                  <span>
                    Page {page + 1} of {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admin Refund Modal */}
      {selectedBookingForRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Execute PayPal Sandbox Refund</h3>
              </div>
              <button
                onClick={() => setSelectedBookingForRefund(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-1 text-xs">
              <p className="text-purple-300 font-semibold">
                Booking Reference: <span className="font-mono text-white">{selectedBookingForRefund.bookingReference}</span>
              </p>
              <p className="text-purple-300/80">
                Payer: {selectedBookingForRefund.user?.name} ({selectedBookingForRefund.user?.email})
              </p>
              {selectedBookingForRefund.payment?.paypalCaptureId && (
                <p className="text-purple-300/80 font-mono text-[11px]">
                  Capture ID: {selectedBookingForRefund.payment.paypalCaptureId}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Refund Amount (₹)
                </label>
                <input
                  type="number"
                  value={refundAmount}
                  max={Number(selectedBookingForRefund.totalAmount)}
                  min={1}
                  onChange={(e) => setRefundAmount(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Original payment amount: ₹{Number(selectedBookingForRefund.totalAmount).toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Reason for Refund
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedBookingForRefund(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingRefund}
                onClick={handleExecuteRefund}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessingRefund ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Refunding via PayPal...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" /> Confirm PayPal Refund
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
