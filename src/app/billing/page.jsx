'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/layout/AppLayout';
import { toast } from 'react-hot-toast';

export default function BillingPage() {
  const user = useUser();
  const [activeSub, setActiveSub] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Manual payment state
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  // Quotas calculations (mocked or loaded)
  const [staffCount, setStaffCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    fetchBillingData();
    fetchQuotaUsage();
  }, []);

  async function fetchBillingData() {
    try {
      setLoading(true);
      const response = await fetch('/api/billing');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setActiveSub(data.subscription || null);
      setPlans(data.plans || []);
      if (data.plans?.length > 0) {
        setSelectedPlanId(data.plans[0].id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  }

  async function fetchQuotaUsage() {
    try {
      const { count: staff } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: students } = await supabase.from('students').select('*', { count: 'exact', head: true });

      setStaffCount(staff || 1);
      setStudentCount(students || 0);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRegisterSub(e) {
    e.preventDefault();
    if (!selectedPlanId || !paymentRef) {
      toast.error('Please select a plan and enter payment reference');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: selectedPlanId,
          payment_reference: paymentRef
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success('Subscription registered successfully!');
      setPaymentRef('');
      fetchBillingData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to register subscription');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
      </div>
    );
  }

  // Quotas based on active sub
  const activePlan = activeSub?.subscription_plans;
  const maxStudents = activePlan?.student_quota_max || 7;
  const maxStaff = activePlan?.staff_accounts || 2;
  const maxCctv = activePlan?.features?.cctv_max_cameras || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
          <span className="text-gold">💳</span> Subscription & Billing
        </h1>
        <p className="text-white/60 text-sm mt-1">
          Review your tenant tier quota limits, activate GO/UP/MAX plans, and register offline payment invoice references.
        </p>
      </div>

      {/* Quotas & Limits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-xs font-semibold uppercase">Students Quota</span>
            <span className="text-gold text-sm font-bold font-mono">{studentCount} / {maxStudents} Max</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2.5">
            <div className="bg-gold h-2.5 rounded-full transition-all" style={{ width: `${Math.min((studentCount / maxStudents) * 100, 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-xs font-semibold uppercase">Staff Accounts</span>
            <span className="text-gold text-sm font-bold font-mono">{staffCount} / {maxStaff} Max</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2.5">
            <div className="bg-gold h-2.5 rounded-full transition-all" style={{ width: `${Math.min((staffCount / maxStaff) * 100, 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-white/60 text-xs font-semibold uppercase">CCTV Camera Channels</span>
            <span className="text-gold text-sm font-bold font-mono">Active / {maxCctv} Max</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2.5">
            <div className="bg-gold h-2.5 rounded-full transition-all" style={{ width: `${maxCctv > 0 ? 50 : 0}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Active Subscription Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-2 border border-gold/10 rounded-xl p-6 space-y-6 shadow-gold">
            <h3 className="font-display text-lg font-bold text-white border-b border-white/5 pb-2">Active Subscription</h3>
            
            {activeSub ? (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-white/50 text-xs">Current Plan Level</p>
                  <p className="text-2xl font-bold text-gold font-display uppercase">{activePlan?.name} PLAN</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Billing Price</p>
                  <p className="font-semibold text-white">${activePlan?.price_per_period} / 4 months</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Expiration Date</p>
                  <p className="font-semibold text-white">{new Date(activeSub.expires_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Status</p>
                  <span className="bg-success/20 text-success border border-success/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    {activeSub.status}
                  </span>
                </div>
                <div>
                  <p className="text-white/50 text-xs">Payment Reference ID</p>
                  <p className="font-mono text-xs text-white/70 break-all">{activeSub.payment_reference}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-danger/10 border border-danger/30 rounded p-4 text-xs text-danger">
                  No active premium subscription found. Your account is operating under default free basic levels.
                </div>
              </div>
            )}
          </div>

          {/* Form: Register Manual Payment */}
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-4 shadow-lg">
            <h3 className="font-display text-lg font-bold text-white">Manual Payment Activation</h3>
            <p className="text-white/60 text-xs leading-relaxed">
              Deposit subscription fees to our official bank account and upload your transaction memo/reference ID below.
            </p>
            <form onSubmit={handleRegisterSub} className="space-y-4">
              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">Select Subscription Tier</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} Plan - ${p.price_per_period} / 4m</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">Bank TxID / Deposit Memo Reference *</label>
                <input
                  type="text"
                  required
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. BKN-10298374-DHAKA"
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2.5 rounded-lg transition-all text-sm"
              >
                {submitting ? 'Submitting Invoice...' : 'Activate Subscription'}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Plans Detail Cards */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-6">
            <h3 className="font-display text-lg font-bold text-white border-b border-white/5 pb-2">GT SaaS Subscription Plans</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-3 border border-white/5 rounded-xl p-5 space-y-4 hover:border-gold/20 transition-all flex flex-col justify-between h-[380px]">
                <div className="space-y-3">
                  <h4 className="font-display text-lg font-bold text-white uppercase tracking-wide">GO PLAN</h4>
                  <div className="text-2xl font-bold text-gold font-display">$79 <span className="text-xs text-white/50">/ 4 Months</span></div>
                  <ul className="text-xs text-white/60 space-y-2 pt-2 border-t border-white/5">
                    <li>✓ Students Quota: 1–7</li>
                    <li>✓ Staff Accounts: 2 max</li>
                    <li>✓ Human Document Review</li>
                    <li>✓ Global internal Comms & Chat</li>
                    <li>✗ No Office CCTV Integration</li>
                    <li>✗ No automated AI Analysis</li>
                  </ul>
                </div>
              </div>

              <div className="bg-surface-3 border border-gold/25 rounded-xl p-5 space-y-4 hover:border-gold/50 transition-all flex flex-col justify-between h-[380px] relative shadow-gold">
                <span className="absolute -top-2.5 right-4 bg-gold text-navy text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  RECOMMENDED
                </span>
                <div className="space-y-3">
                  <h4 className="font-display text-lg font-bold text-white uppercase tracking-wide">UP PLAN</h4>
                  <div className="text-2xl font-bold text-gold font-display">$139 <span className="text-xs text-white/50">/ 4 Months</span></div>
                  <ul className="text-xs text-white/60 space-y-2 pt-2 border-t border-white/5">
                    <li>✓ Students Quota: 5–13</li>
                    <li>✓ Staff Accounts: 5 max</li>
                    <li>✓ Office CCTV: 6 Cameras max</li>
                    <li>✓ AI Doc Analysis: 10 Students</li>
                    <li>✓ Smart Google Calendar Sync</li>
                    <li>✓ AI Marketing Copilot</li>
                  </ul>
                </div>
              </div>

              <div className="bg-surface-3 border border-white/5 rounded-xl p-5 space-y-4 hover:border-gold/20 transition-all flex flex-col justify-between h-[380px]">
                <div className="space-y-3">
                  <h4 className="font-display text-lg font-bold text-white uppercase tracking-wide">MAX PLAN</h4>
                  <div className="text-2xl font-bold text-gold font-display">$199 <span className="text-xs text-white/50">/ 4 Months</span></div>
                  <ul className="text-xs text-white/60 space-y-2 pt-2 border-t border-white/5">
                    <li>✓ Students Quota: 8–25</li>
                    <li>✓ Staff Accounts: 13 max</li>
                    <li>✓ Office CCTV: 15 Cameras max</li>
                    <li>✓ AI Doc Analysis: 25 Students</li>
                    <li>✓ Complete ERP & FMS tools</li>
                    <li>✓ Global super admin audit logs</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
