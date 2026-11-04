import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../../services';
import {
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { useToast } from '../../components/ui/Toast';

// Register AG Grid Community Modules
ModuleRegistry.registerModules([AllCommunityModule]);

const AdminUsers: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [quickFilterText, setQuickFilterText] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers(0, 100, '', roleFilter);
      const data = res.data?.data;
      const list = data?.content || (Array.isArray(data) ? data : []);
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users for AG Grid:', err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleVerified = async (id: string, currentStatus: boolean) => {
    try {
      await adminService.updateUserStatus(id, currentStatus ? 'UNVERIFIED' : 'VERIFIED');
      toast.success('User verification status updated.');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update user status.');
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await adminService.updateUserRole(id, newRole);
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update user role.');
    }
  };

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      field: 'name',
      headerName: 'Traveler / User',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 200,
      flex: 1.2,
      cellRenderer: (params: any) => {
        const data = params.data;
        if (!data) return null;
        return (
          <div className="flex items-center gap-2.5 py-1">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
              {data.name?.charAt(0) || 'U'}
            </div>
            <div className="leading-tight truncate">
              <span className="font-semibold text-white block truncate">{data.name}</span>
              <span className="text-[11px] text-slate-400 block truncate">{data.email}</span>
            </div>
          </div>
        );
      },
    },
    {
      field: 'role',
      headerName: 'Role',
      filter: 'agTextColumnFilter',
      sortable: true,
      width: 140,
      cellRenderer: (params: any) => {
        const data = params.data;
        if (!data) return null;
        const isAdmin = data.role === 'ADMIN';
        return (
          <select
            value={data.role}
            onChange={(e) => handleRoleChange(data.id, e.target.value)}
            className={`text-xs font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
              isAdmin
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        );
      },
    },
    {
      field: 'isEmailVerified',
      headerName: 'Verified',
      sortable: true,
      width: 130,
      cellRenderer: (params: any) => {
        const data = params.data;
        if (!data) return null;
        return (
          <button
            onClick={() => handleToggleVerified(data.id, data.isEmailVerified)}
            className={`px-2 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
              data.isEmailVerified
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
            }`}
          >
            {data.isEmailVerified ? (
              <>
                <CheckCircle className="w-3 h-3" /> Verified
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" /> Unverified
              </>
            )}
          </button>
        );
      },
    },
    {
      field: 'totalBookings',
      headerName: 'Bookings',
      filter: 'agNumberColumnFilter',
      sortable: true,
      width: 110,
      cellClass: 'font-mono text-cyan-300 font-bold',
    },
    {
      field: 'totalSpent',
      headerName: 'Total Spent',
      filter: 'agNumberColumnFilter',
      sortable: true,
      width: 140,
      valueFormatter: (params: any) => `₹${Number(params.value || 0).toLocaleString('en-IN')}`,
      cellClass: 'font-mono font-bold text-emerald-400',
    },
    {
      field: 'createdAt',
      headerName: 'Joined Date',
      filter: 'agDateColumnFilter',
      sortable: true,
      width: 130,
      valueFormatter: (params: any) =>
        params.value ? new Date(params.value).toLocaleDateString('en-IN') : 'N/A',
      cellClass: 'text-slate-400 text-xs',
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
          <h1 className="text-2xl font-bold text-white tracking-tight">
            User Management & <span className="text-gradient-cyan">AG Grid Control</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Sort, filter, and manage registered travelers, administrators, and verification status using high-performance AG Grid.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Filter and Quick Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={quickFilterText}
            onChange={(e) => setQuickFilterText(e.target.value)}
            placeholder="Quick search across all columns..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Role:
          </span>
          {['', 'USER', 'ADMIN'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                roleFilter === r
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {r || 'All Roles'}
            </button>
          ))}
        </div>
      </div>

      {/* AG GRID CONTAINER */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-slate-900">
        <div className="ag-theme-quartz-dark" style={{ height: 500, width: '100%' }}>
          <AgGridReact
            rowData={users}
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
  );
};

export default AdminUsers;
