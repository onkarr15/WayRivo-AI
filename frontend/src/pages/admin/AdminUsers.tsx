import React, { useState, useEffect } from 'react';
import { adminService } from '../../services';
import { Search, UserCheck, UserX } from 'lucide-react';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fallback demo users if backend has just starter seed
  const fallbackUsers = [
    { id: 1, name: 'Arjun Sharma', email: 'arjun@example.com', role: 'TRAVELER', phone: '+91 98765 11111', active: true, createdAt: '2026-08-10' },
    { id: 2, name: 'Vikram Mehta', email: 'vikram@example.com', role: 'EXPERT', phone: '+91 98765 22222', active: true, createdAt: '2026-08-11' },
    { id: 3, name: 'Ananya Iyer', email: 'ananya@example.com', role: 'EXPERT', phone: '+91 98765 33333', active: true, createdAt: '2026-08-12' },
    { id: 4, name: 'Rahul Verma', email: 'rahul@example.com', role: 'TRAVELER', phone: '+91 98765 44444', active: true, createdAt: '2026-08-14' },
    { id: 5, name: 'WayRivo Admin', email: 'admin@wayrivo.com', role: 'ADMIN', phone: '+91 90000 00000', active: true, createdAt: '2026-08-01' },
  ];

  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers(page, 10, search, role);
      const data = res.data?.data;
      if (data?.content && data.content.length > 0) {
        setUsers(data.content);
        setTotalPages(data.totalPages || 1);
      } else {
        setUsers(fallbackUsers);
      }
    } catch {
      setUsers(fallbackUsers);
    }
    setLoading(false);
  }, [page, search, role]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    const nextStatus = currentStatus ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminService.updateUserStatus(id, nextStatus);
      fetchUsers();
    } catch {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, active: !currentStatus } : u));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">User Management</h1>
          <p className="text-sm text-text-light mt-1">View, search, and manage registered travelers, experts, and administrators</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light" />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>

        <div className="flex gap-2">
          {['', 'TRAVELER', 'EXPERT', 'ADMIN'].map(r => (
            <button
              key={r}
              onClick={() => { setRole(r); setPage(0); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                role === r ? 'bg-orange text-white shadow' : 'bg-white border border-border text-text-light hover:bg-gray-50'
              }`}
            >
              {r || 'All Roles'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-border text-text-light text-xs uppercase font-semibold">
                <tr>
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-navy to-navy-light text-white font-bold flex items-center justify-center text-xs">
                          {u.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-navy">{u.name}</p>
                          <p className="text-xs text-text-light">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`badge ${
                        u.role === 'ADMIN' ? 'badge-danger' : u.role === 'EXPERT' ? 'badge-info' : 'badge-neutral'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-text-light">{u.phone || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`badge ${u.active !== false ? 'badge-success' : 'badge-danger'}`}>
                        {u.active !== false ? 'ACTIVE' : 'SUSPENDED'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button
                          onClick={() => handleToggleStatus(u.id, u.active !== false)}
                          className={`btn-ghost text-xs px-3 py-1.5 ${
                            u.active !== false ? 'text-danger hover:bg-red-50' : 'text-success hover:bg-emerald-50'
                          }`}
                        >
                          {u.active !== false ? (
                            <><UserX className="w-3.5 h-3.5 mr-1 inline" /> Suspend</>
                          ) : (
                            <><UserCheck className="w-3.5 h-3.5 mr-1 inline" /> Activate</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-border">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="btn-ghost text-xs">
              Previous
            </button>
            <span className="btn-ghost text-xs">Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="btn-ghost text-xs">
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
