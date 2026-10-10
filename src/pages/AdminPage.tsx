// CampusMart — Admin Page (ADMIN-01, ADMIN-02)
// Protected by RequireAdmin route guard AND user_roles RLS.
// Three tabs: Users, Products, Reports.
// Admin can hide/unhide products and update report status.
// No service-role key. No Auth admin API calls.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryKeys';
import { formatINR, formatDate, STATUS_LABELS, REPORT_STATUS_LABELS, getStatusClasses } from '@/lib/formatters';
import { useToast } from '@/components/feedback/ToastContext';
import type { ProfileRow, ProductRow, ReportWithDetails, ReportStatus } from '@/types/database.types';

type AdminTab = 'users' | 'products' | 'reports';

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('users');
  const qc = useQueryClient();
  const { showToast } = useToast();

  // ---- Users tab ----
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: queryKeys.adminUsers,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, college, department, graduation_year, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ProfileRow[];
    },
    enabled: tab === 'users',
  });

  // ---- Products tab ----
  const { data: adminProducts, isLoading: productsLoading } = useQuery({
    queryKey: queryKeys.adminProducts,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, price, status, is_hidden, created_at, seller_id, profiles(full_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as (ProductRow & { profiles: { full_name: string } })[];
    },
    enabled: tab === 'products',
  });

  // ---- Reports tab ----
  const { data: adminReports, isLoading: reportsLoading } = useQuery({
    queryKey: queryKeys.adminReports,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          id, reason, status, details, created_at, reviewed_at,
          products ( id, title, status ),
          profiles ( id, full_name, college )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ReportWithDetails[];
    },
    enabled: tab === 'reports',
  });

  // Hide/unhide product (REP-02)
  const hideMutation = useMutation({
    mutationFn: async ({ id, hide }: { id: string; hide: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_hidden: hide })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { hide }) => {
      qc.invalidateQueries({ queryKey: queryKeys.adminProducts });
      qc.invalidateQueries({ queryKey: queryKeys.products() });
      showToast(hide ? 'Product hidden' : 'Product restored');
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  // Update report status (REP-02)
  const reportMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReportStatus }) => {
      const { error } = await supabase
        .from('reports')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.adminReports });
      showToast('Report status updated');
    },
    onError: (e: Error) => showToast(e.message, 'error'),
  });

  const isLoading = tab === 'users' ? usersLoading : tab === 'products' ? productsLoading : reportsLoading;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Shield size={20} className="text-gallery-black" aria-hidden />
        <h1 className="text-subheading font-medium tracking-tight">Admin Dashboard</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap" role="tablist">
        {(['users', 'products', 'reports'] as AdminTab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`btn-ghost py-1.5 px-4 text-caption capitalize ${tab === t ? 'bg-gallery-black text-paper-white border-gallery-black' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}
        </div>
      )}

      {/* ---- Users Table ---- */}
      {tab === 'users' && !usersLoading && (
        <div className="overflow-x-auto">
          <table className="w-full text-caption border-collapse">
            <thead>
              <tr className="border-b border-hairline-gray text-left">
                <th className="py-3 pr-4 font-medium text-ash-gray">Name</th>
                <th className="py-3 pr-4 font-medium text-ash-gray">College</th>
                <th className="py-3 pr-4 font-medium text-ash-gray">Department</th>
                <th className="py-3 font-medium text-ash-gray">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => (
                <tr key={u.id} className="border-b border-hairline-gray hover:bg-soft-lift">
                  <td className="py-3 pr-4 font-medium">{u.full_name}</td>
                  <td className="py-3 pr-4 text-ash-gray">{u.college}</td>
                  <td className="py-3 pr-4 text-ash-gray">{u.department ?? '—'}</td>
                  <td className="py-3 text-ash-gray">{formatDate(u.created_at)}</td>
                </tr>
              ))}
              {users?.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-ash-gray">No users</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- Products Table ---- */}
      {tab === 'products' && !productsLoading && (
        <div className="overflow-x-auto">
          <table className="w-full text-caption border-collapse">
            <thead>
              <tr className="border-b border-hairline-gray text-left">
                <th className="py-3 pr-4 font-medium text-ash-gray">Title</th>
                <th className="py-3 pr-4 font-medium text-ash-gray">Seller</th>
                <th className="py-3 pr-4 font-medium text-ash-gray">Price</th>
                <th className="py-3 pr-4 font-medium text-ash-gray">Status</th>
                <th className="py-3 pr-4 font-medium text-ash-gray">Visible</th>
                <th className="py-3 font-medium text-ash-gray">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminProducts?.map((p) => (
                <tr key={p.id} className="border-b border-hairline-gray hover:bg-soft-lift">
                  <td className="py-3 pr-4 max-w-xs truncate font-medium">{p.title}</td>
                  <td className="py-3 pr-4 text-ash-gray">{p.profiles?.full_name}</td>
                  <td className="py-3 pr-4">{formatINR(p.price)}</td>
                  <td className="py-3 pr-4">
                    <span className={`status-badge ${getStatusClasses(p.status)}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{p.is_hidden ? <span className="text-ash-gray">Hidden</span> : <span>Visible</span>}</td>
                  <td className="py-3">
                    <button
                      onClick={() => hideMutation.mutate({ id: p.id, hide: !p.is_hidden })}
                      disabled={hideMutation.isPending}
                      className="btn-ghost py-1 px-3 text-xs"
                    >
                      {p.is_hidden ? 'Restore' : 'Hide'}
                    </button>
                  </td>
                </tr>
              ))}
              {adminProducts?.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-ash-gray">No products</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- Reports Table ---- */}
      {tab === 'reports' && !reportsLoading && (
        <div className="overflow-x-auto">
          <table className="w-full text-caption border-collapse">
            <thead>
              <tr className="border-b border-hairline-gray text-left">
                <th className="py-3 pr-4 font-medium text-ash-gray">Product</th>
                <th className="py-3 pr-4 font-medium text-ash-gray">Reporter</th>
                <th className="py-3 pr-4 font-medium text-ash-gray">Reason</th>
                <th className="py-3 pr-4 font-medium text-ash-gray">Status</th>
                <th className="py-3 pr-4 font-medium text-ash-gray">Reported</th>
                <th className="py-3 font-medium text-ash-gray">Update</th>
              </tr>
            </thead>
            <tbody>
              {adminReports?.map((r) => (
                <tr key={r.id} className="border-b border-hairline-gray hover:bg-soft-lift">
                  <td className="py-3 pr-4 max-w-xs truncate font-medium">{r.products?.title}</td>
                  <td className="py-3 pr-4 text-ash-gray">{r.profiles?.full_name}</td>
                  <td className="py-3 pr-4 text-ash-gray capitalize">{r.reason.replace(/_/g, ' ')}</td>
                  <td className="py-3 pr-4">
                    <span className="text-caption font-medium">{REPORT_STATUS_LABELS[r.status]}</span>
                  </td>
                  <td className="py-3 pr-4 text-ash-gray">{formatDate(r.created_at)}</td>
                  <td className="py-3">
                    <select
                      className="select text-caption py-1"
                      style={{ minWidth: '120px' }}
                      value={r.status}
                      onChange={(e) => reportMutation.mutate({ id: r.id, status: e.target.value as ReportStatus })}
                      disabled={reportMutation.isPending}
                      aria-label={`Update status for report on ${r.products?.title}`}
                    >
                      {(['open', 'reviewing', 'resolved', 'dismissed'] as ReportStatus[]).map((s) => (
                        <option key={s} value={s}>{REPORT_STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {adminReports?.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-ash-gray">No reports</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
