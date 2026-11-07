import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../../services';
import {
  Search,
  CheckCircle,
  XCircle,
  RefreshCw,
  Filter,
  Users,
  Table,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Eye,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { wayrivoAgGridTheme } from '../../utils/agGridTheme';
import { useToast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

// Register AG Grid Community Modules
ModuleRegistry.registerModules([AllCommunityModule]);

const roleBadgeColors: Record<string, string> = {
  ADMIN: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  EXPERT: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  TRAVELER: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  USER: 'bg-slate-800 text-slate-300 border-slate-700',
};

const AdminUsers: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [quickFilterText, setQuickFilterText] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Detailed User Profile Modal State
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [userProfileData, setUserProfileData] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers(0, 100, '', roleFilter);
      const data = res.data?.data;
      const list = data?.content || (Array.isArray(data) ? data : []);
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users for Admin Users:', err);
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
      if (userProfileData && userProfileData.id === id) {
        setUserProfileData({ ...userProfileData, role: newRole });
      }
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update user role.');
    }
  };

  const handleOpenProfile = async (u: any) => {
    setSelectedUser(u);
    setUserProfileData(null);
    setIsProfileModalOpen(true);
    setLoadingProfile(true);
    try {
      const res = await adminService.getUserProfile(u.id);
      setUserProfileData(res.data?.data || u);
    } catch {
      setUserProfileData(u);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleToggleSuspended = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      await adminService.updateUserStatus(id, newStatus);
      toast.success(`User account status updated to ${newStatus}.`);
      if (userProfileData && userProfileData.id === id) {
        setUserProfileData({ ...userProfileData, status: newStatus });
      }
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update account status.');
    }
  };

  // Filtered users for Table view
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = quickFilterText.toLowerCase();
      const matchesSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.role && u.role.toLowerCase().includes(q));
      const matchesRole = !roleFilter || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, quickFilterText, roleFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage]);

  // AG Grid Column Definitions
  const columnDefs = useMemo<ColDef[]>(() => [
    {
      field: 'name',
      headerName: 'Traveler / User',
      filter: 'agTextColumnFilter',
      sortable: true,
      minWidth: 220,
      flex: 1.2,
      cellRenderer: (params: any) => {
        const data = params.data;
        if (!data) return null;
        return (
          <div className="flex items-center gap-2.5 py-1">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">
              {data.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="leading-tight truncate">
              <span className="font-semibold text-white block truncate">{data.name || 'Unnamed User'}</span>
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
      width: 150,
      cellRenderer: (params: any) => {
        const data = params.data;
        if (!data) return null;
        const currentRole = data.role || 'USER';
        return (
          <select
            value={currentRole}
            onChange={(e) => handleRoleChange(data.id, e.target.value)}
            className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
              roleBadgeColors[currentRole] || 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <option value="USER">USER</option>
            <option value="TRAVELER">TRAVELER</option>
            <option value="EXPERT">EXPERT</option>
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
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
              data.isEmailVerified
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
            }`}
          >
            {data.isEmailVerified ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Verified
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-amber-400" /> Unverified
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
    {
      headerName: 'Actions',
      width: 140,
      cellRenderer: (params: any) => {
        const data = params.data;
        if (!data) return null;
        return (
          <button
            onClick={() => handleOpenProfile(data)}
            className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-semibold border border-cyan-500/30 flex items-center gap-1 cursor-pointer transition-colors mt-1"
          >
            <Eye className="w-3.5 h-3.5" /> View Profile
          </button>
        );
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
            <Users className="w-3.5 h-3.5 text-cyan-400" /> Platform Accounts & Security Management
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            User Accounts & <span className="text-gradient-cyan">Access Control</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage travelers, local verified experts, and administrators across the WayRivo AI platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
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
          </div>

          <button
            onClick={fetchUsers}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter and Quick Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={quickFilterText}
            onChange={(e) => {
              setQuickFilterText(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, email, or role..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" /> Filter Role:
          </span>
          {[
            { label: 'All Roles', value: '' },
            { label: 'Traveler', value: 'TRAVELER' },
            { label: 'Expert', value: 'EXPERT' },
            { label: 'Admin', value: 'ADMIN' },
            { label: 'User', value: 'USER' },
          ].map((r) => (
            <button
              key={r.value}
              onClick={() => {
                setRoleFilter(r.value);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                roleFilter === r.value
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Total Registered</span>
          <span className="text-base font-bold text-white font-mono">{users.length}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Travelers</span>
          <span className="text-base font-bold text-cyan-400 font-mono">
            {users.filter((u) => u.role === 'TRAVELER' || u.role === 'USER').length}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Local Experts</span>
          <span className="text-base font-bold text-amber-400 font-mono">
            {users.filter((u) => u.role === 'EXPERT').length}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Administrators</span>
          <span className="text-base font-bold text-purple-400 font-mono">
            {users.filter((u) => u.role === 'ADMIN').length}
          </span>
        </div>
      </div>

      {/* VIEW 1: HIGH-VISIBILITY TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No users found matching your search or filter criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 text-[11px] font-bold uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">User / Traveler</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Verification</th>
                    <th className="p-3.5 text-center">Bookings</th>
                    <th className="p-3.5 text-right">Total Spent</th>
                    <th className="p-3.5">Joined Date</th>
                    <th className="p-3.5 text-center">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {paginatedUsers.map((u) => {
                    const currentRole = u.role || 'USER';
                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                        {/* Name & Email */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 border border-cyan-500/30">
                              {u.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="leading-tight truncate max-w-[200px] sm:max-w-none">
                              <span className="font-semibold text-white block truncate">{u.name || 'Unnamed User'}</span>
                              <span className="text-[11px] text-slate-400 block truncate font-mono">{u.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* Role Select */}
                        <td className="p-3.5">
                          <select
                            value={currentRole}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                              roleBadgeColors[currentRole] || 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            <option value="USER">USER</option>
                            <option value="TRAVELER">TRAVELER</option>
                            <option value="EXPERT">EXPERT</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>

                        {/* Email Verified */}
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleVerified(u.id, u.isEmailVerified)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                              u.isEmailVerified
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                            }`}
                          >
                            {u.isEmailVerified ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" /> Verified
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5" /> Unverified
                              </>
                            )}
                          </button>
                        </td>

                        {/* Total Bookings */}
                        <td className="p-3.5 text-center font-mono font-bold text-cyan-300">
                          {u.totalBookings || 0}
                        </td>

                        {/* Total Spent */}
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-400">
                          ₹{Number(u.totalSpent || 0).toLocaleString('en-IN')}
                        </td>

                        {/* Joined Date */}
                        <td className="p-3.5 text-slate-400 text-xs">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                        </td>

                        {/* Profile Action */}
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleOpenProfile(u)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-semibold border border-cyan-500/30 flex items-center gap-1 mx-auto cursor-pointer transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination Controls */}
              <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-white">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
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
              rowData={filteredUsers}
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
      {/* Detailed User Profile Inspection Modal */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title={selectedUser?.name ? `User Profile: ${selectedUser.name}` : 'User Profile'}
        subtitle="Comprehensive account telemetry, permissions, preferences, and booking records."
      >
        {loadingProfile ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Loading user telemetry...</p>
          </div>
        ) : !userProfileData ? (
          <div className="p-8 text-center text-xs text-slate-400">Unable to retrieve user profile.</div>
        ) : (
          <div className="space-y-6 text-xs pt-2">
            {/* Identity Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-slate-950 font-black text-lg flex items-center justify-center shrink-0 shadow-md">
                  {userProfileData.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white">{userProfileData.name || 'Unnamed User'}</h3>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                        roleBadgeColors[userProfileData.role || 'USER']
                      }`}
                    >
                      {userProfileData.role || 'USER'}
                    </span>
                  </div>
                  <p className="text-slate-400 font-mono text-[11px] mt-0.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" /> {userProfileData.email}
                  </p>
                  <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-500" /> {userProfileData.phone || '+91 98765 43210 (Default)'}
                  </p>
                </div>
              </div>

              {/* Status Controls */}
              <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleVerified(userProfileData.id, userProfileData.isEmailVerified)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                    userProfileData.isEmailVerified
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25'
                  }`}
                >
                  {userProfileData.isEmailVerified ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" /> Email Verified
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" /> Unverified Email
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleSuspended(userProfileData.id, userProfileData.status || 'ACTIVE')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors ${
                    userProfileData.status === 'SUSPENDED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700 hover:text-rose-300'
                  }`}
                >
                  {userProfileData.status === 'SUSPENDED' ? (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Account Suspended
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Account Active
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Account Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Bookings</span>
                <p className="text-base font-black text-cyan-400 font-mono">
                  {userProfileData.totalBookings || userProfileData._count?.bookings || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Spent</span>
                <p className="text-base font-black text-emerald-400 font-mono">
                  ₹{Number(userProfileData.totalSpent || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Budget Tier</span>
                <p className="text-xs font-bold text-white mt-1">
                  {userProfileData.budgetPreference || 'Moderate'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Currency</span>
                <p className="text-xs font-bold text-white mt-1">
                  {userProfileData.preferredCurrency || 'INR (₹)'}
                </p>
              </div>
            </div>

            {/* Travel Preferences */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" /> Travel Interests & Preferred Destinations
              </h4>

              <div className="space-y-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Destinations of Interest:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(userProfileData.preferredDestinations?.length
                      ? userProfileData.preferredDestinations
                      : ['Kerala', 'Himachal Pradesh', 'Rajasthan']
                    ).map((d: string) => (
                      <span key={d} className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[11px]">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Travel Themes:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(userProfileData.travelInterests?.length
                      ? userProfileData.travelInterests
                      : ['Backwaters', 'Heritage Tours', 'Luxury Stays']
                    ).map((t: string) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[11px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Booking History */}
            {userProfileData.bookings && userProfileData.bookings.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Briefcase className="w-3.5 h-3.5 text-cyan-400" /> Recent Bookings Under Escrow
                </h4>
                <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
                  {userProfileData.bookings.slice(0, 4).map((b: any) => (
                    <div key={b.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-cyan-400 block">{b.bookingReference}</span>
                        <span className="text-[10px] text-slate-400">
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-white block">
                          ₹{Number(b.totalAmount || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-bold uppercase">{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer with Metadata & Dismiss */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-slate-400 text-[11px]">
              <span>ID: <code className="text-slate-300 font-mono text-[10px]">{userProfileData.id}</code></span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsProfileModalOpen(false)}
              >
                Close Profile
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;
