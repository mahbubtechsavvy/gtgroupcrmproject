'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/layout/AppLayout';
import { toast } from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const user = useUser();
  const [offices, setOffices] = useState([]);
  const [users, setUsers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit / Override state
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [availablePlans, setAvailablePlans] = useState([]);
  const [overriding, setOverriding] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    try {
      setLoading(true);

      // 1. Fetch Offices
      const { data: offData } = await supabase.from('offices').select('*').order('name');
      setOffices(offData || []);

      // 2. Fetch Users
      const { data: usrData } = await supabase.from('users').select('*, offices(name)').order('full_name');
      setUsers(usrData || []);

      // 3. Fetch Subscriptions
      const { data: subData } = await supabase.from('tenant_subscriptions').select('*, offices(name), subscription_plans(name)');
      setSubscriptions(subData || []);

      // 4. Fetch Plans
      const { data: planData } = await supabase.from('subscription_plans').select('*');
      setAvailablePlans(planData || []);
      if (planData?.length > 0) {
        setSelectedPlanId(planData[0].id);
      }
      if (offData?.length > 0) {
        setSelectedOfficeId(offData[0].id);
      }

    } catch (err) {
      console.error(err);
      toast.error('Failed to load Super Admin dashboard records');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleUserStatus(userId, currentStatus) {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('users')
        .update({ status: nextStatus })
        .eq('id', userId);

      if (error) throw error;
      toast.success(`User status updated to ${nextStatus}`);
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update user status');
    }
  }

  async function handleOverrideSubscription(e) {
    e.preventDefault();
    if (!selectedOfficeId || !selectedPlanId) return;

    try {
      setOverriding(true);

      // Expire old subscription
      await supabase
        .from('tenant_subscriptions')
        .update({ status: 'expired' })
        .eq('office_id', selectedOfficeId)
        .eq('status', 'active');

      const nextExpiry = new Date();
      nextExpiry.setMonth(nextExpiry.getMonth() + 4);

      // Insert override
      const { error } = await supabase
        .from('tenant_subscriptions')
        .insert({
          office_id: selectedOfficeId,
          plan_id: selectedPlanId,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: nextExpiry.toISOString(),
          payment_reference: 'SUPERADMIN-OVERRIDE',
          student_count: 0
        });

      if (error) throw error;
      toast.success('Subscription override applied successfully');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to override subscription');
    } finally {
      setOverriding(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
          <span className="text-gold">🛡️</span> Super Admin Control Panel
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Global CRM administration. Manage multi-tenant offices, adjust subscription tiers, toggle user accounts, and review database states.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface-2 border border-white/5 rounded-xl p-5 shadow-lg">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Total Offices</p>
          <h2 className="text-2xl font-bold text-white mt-1">{offices.length}</h2>
        </div>
        <div className="bg-surface-2 border border-white/5 rounded-xl p-5 shadow-lg">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Total Users</p>
          <h2 className="text-2xl font-bold text-white mt-1">{users.length}</h2>
        </div>
        <div className="bg-surface-2 border border-white/5 rounded-xl p-5 shadow-lg">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Active Subscriptions</p>
          <h2 className="text-2xl font-bold text-gold mt-1">
            {subscriptions.filter(s => s.status === 'active').length}
          </h2>
        </div>
        <div className="bg-surface-2 border border-white/5 rounded-xl p-5 shadow-lg">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider">Database Status</p>
          <h2 className="text-lg font-bold text-success mt-1">🟢 Connected</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Tenant Offices & Overrides */}
        <div className="lg:col-span-1 space-y-6">
          {/* Subscription Override Form */}
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-4 shadow-lg">
            <h3 className="font-display text-lg font-bold text-white">Manual Tier Assignment</h3>
            <p className="text-white/60 text-xs leading-relaxed">
              Bypass billing logic and manually override the active subscription tier for any registered office branch.
            </p>
            <form onSubmit={handleOverrideSubscription} className="space-y-4">
              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">Select Office Branch</label>
                <select
                  value={selectedOfficeId}
                  onChange={(e) => setSelectedOfficeId(e.target.value)}
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                >
                  {offices.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">Select Target Tier</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                >
                  {availablePlans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} Plan</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={overriding}
                className="w-full bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2.5 rounded-lg transition-all text-sm shadow-md"
              >
                {overriding ? 'Applying Override...' : 'Apply Tier Override'}
              </button>
            </form>
          </div>

          {/* Active Subscriptions directory */}
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-4 shadow-lg max-h-[300px] overflow-y-auto">
            <h3 className="font-display text-sm font-bold text-white border-b border-white/5 pb-2">Active Multi-Tenant list</h3>
            {subscriptions.length === 0 ? (
              <p className="text-white/30 text-xs text-center py-6">No subscriptions recorded.</p>
            ) : (
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="bg-surface-3 border border-white/5 p-3 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-white">{sub.offices?.name}</div>
                      <div className="text-[10px] text-white/50">Expires: {new Date(sub.expires_at).toLocaleDateString()}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                      sub.status === 'active' ? 'bg-success/20 text-success border-success/30' : 'bg-white/5 text-white/40 border-white/10'
                    }`}>
                      {sub.subscription_plans?.name || 'Unknown'} : {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: User Account Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-6 shadow-lg">
            <h3 className="font-display text-lg font-bold text-white">Global Staff Account Management</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 uppercase font-semibold">
                    <th className="py-3 px-4">Name / ID</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Office Branch</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((usr) => (
                    <tr key={usr.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{usr.full_name}</div>
                        <div className="font-mono text-[9px] text-gold">{usr.id.substring(0, 8)}</div>
                      </td>
                      <td className="py-3 px-4 text-white/70">{usr.email}</td>
                      <td className="py-3 px-4 text-white/60">{usr.offices?.name || 'All Offices (Super)'}</td>
                      <td className="py-3 px-4 uppercase text-[10px] text-white/50">{usr.role}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                          usr.status === 'inactive' ? 'bg-danger/20 text-danger border-danger/30' : 'bg-success/20 text-success border-success/30'
                        }`}>
                          {usr.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(usr.id, usr.status)}
                          className="border border-white/10 text-white/80 hover:border-gold/30 hover:text-gold px-2.5 py-1 rounded transition-all"
                        >
                          Change status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
