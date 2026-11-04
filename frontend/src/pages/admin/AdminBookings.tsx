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
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
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
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid');
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
        const status = params.value || 'PENDING';
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
              statusBadgeStyles[status] || 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      field: 'payment.escrowStatus',
      headerName: 'Escrow Status',
      sortable: true,
      filter: 'agTextColumnFilter',
      width: 130,
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
            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            All Bookings & <span className="text-gradient-cyan">Escrow Transactions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit active reservations, escrow deposits, and execute administrator-controlled PayPal refunds via AG Grid
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                viewMode === 'grid'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3.5 h-3.5" /> AG Grid
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1 ${
                viewMode === 'cards'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Cards
            </button>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> PayPal Developer Sandbox Active
          </span>
        </div>
      </div>

      {/* AG Grid View */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
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
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">
              {bookings.length} reservations loaded
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-900">
            <div className="ag-theme-quartz-dark" style={{ height: 520, width: '100%' }}>
              <AgGridReact
                rowData={bookings}
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
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              No bookings recorded yet in the database.
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((b: any) => {
                const isConfirmedOrEscrow = b.status === 'CONFIRMED' || b.status === 'ESCROW_HOLD';
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
                              statusBadgeStyles[b.status] || 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {b.status === 'ESCROW_HOLD' ? 'Escrow Held' : b.status.replace('_', ' ')}
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
                          <span className="font-bold text-white text-sm">
                            ₹{Number(b.totalAmount).toLocaleString('en-IN')}
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

                        {b.status === 'REFUNDED' && (
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

      {/* Admin Refund Modal (Part D) */}
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

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Refund Amount (INR) — Max ₹{Number(selectedBookingForRefund.totalAmount).toLocaleString('en-IN')}
              </label>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                max={Number(selectedBookingForRefund.totalAmount)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Administrator Reason / Note to Payer
              </label>
              <textarea
                rows={2}
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedBookingForRefund(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleExecuteRefund}
                disabled={isProcessingRefund}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isProcessingRefund ? 'Processing Refund...' : 'Confirm & Execute Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
