'use client';

import React, { useState, useEffect } from 'react';
import { ExecutiveHero, ExecutiveSection, MetricGrid } from '@/components/crm/ExecutivePage';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  ClipboardList, 
  CheckCircle, 
  XOctagon, 
  MapPin, 
  Calendar,
  DollarSign
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import { getOfficeMeta } from '@/lib/officeMetadata';
import styles from './expenditure.module.css';

export default function ExpenditurePage() {
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemForm, setItemForm] = useState({
    position_or_department: '',
    purpose: '',
    estimated_cost: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = getSupabaseClient();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: user } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setCurrentUser(user);

      const isSuper = isSuperAdmin(user?.role);
      const res = await fetch(`/api/expenditure?officeId=${isSuper ? '' : user?.office_id || ''}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setPlans(data);
        if (data.length > 0) loadPlanDetails(data[0].id);
      } else {
        console.error('Fetch error:', data?.error || 'Unknown error');
        setPlans([]);
      }
    } catch (err) { 
      console.error(err); 
      setPlans([]);
    } finally { 
      setLoading(false); 
    }
  };

  const loadPlanDetails = async (id) => {
    try {
      const res = await fetch(`/api/expenditure?planId=${id}`);
      const data = await res.json();
      if (res.ok && !data.error) {
        setActivePlan(data);
      } else {
        console.error('Load plan details error:', data?.error);
        setActivePlan(null);
      }
    } catch (err) {
      console.error(err);
      setActivePlan(null);
    }
  };

  const createPlan = async () => {
    const month = prompt("Plan for Month (YYYY-MM-01)", "2026-05-01");
    if (!month) return;
    try {
      const res = await fetch('/api/expenditure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'create_plan',
          plan_data: { office_id: currentUser.office_id, plan_month: month, created_by: currentUser.id }
        })
      });
      if (res.ok) fetchData();
    } catch (err) { alert('Already exists for this month'); }
  };

  const addItem = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenditure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'add_item', items_data: { ...itemForm, plan_id: activePlan.id } })
      });
      if (res.ok) {
        setShowItemForm(false);
        loadPlanDetails(activePlan.id);
      }
    } catch (err) { alert('Error'); }
  };

  const updateStatus = async (status) => {
    try {
      const res = await fetch('/api/expenditure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'update_status', plan_id: activePlan.id, status })
      });
      if (res.ok) loadPlanDetails(activePlan.id);
    } catch (err) { alert('Error'); }
  };

  if (loading) return <div className="empty-state">Loading Expenditure Plans...</div>;

  const totalEstimate = activePlan?.items?.reduce((acc, i) => acc + parseFloat(i.estimated_cost || 0), 0) || 0;
  const activeOfficeMeta = getOfficeMeta(plans.find((plan) => plan.id === activePlan?.id)?.offices || currentUser?.offices || {});

  return (
    <div className={styles.container}>
      <ExecutiveHero
        eyebrow="Budget Forecasting"
        title="Budgeting & Plans"
        subtitle="Strategic office budget requests with local-currency planning and headquarters-normalized USD / KRW visibility."
        actions={<button className="btn btn-primary" onClick={createPlan}><TrendingUp size={16} /> Plan Next Month</button>}
      />

      <ExecutiveSection title="Budget Snapshot">
        <MetricGrid items={[
          { label: `Projected (${activeOfficeMeta.currency})`, value: totalEstimate.toFixed(2) },
          { label: 'USD Equivalent', value: (totalEstimate * activeOfficeMeta.usdRate).toFixed(2) },
          { label: 'KRW Equivalent', value: Math.round(totalEstimate * activeOfficeMeta.krwRate) },
          { label: 'Request Items', value: activePlan?.items?.length || 0 },
        ]} />
      </ExecutiveSection>

      <div className={styles.planGrid}>
        {/* Sidebar */}
        <div className={styles.sidebarArea}>
           {plans.map(p => (
             <div key={p.id} className={`${styles.planItem} ${activePlan?.id === p.id ? styles.active : ''}`} onClick={() => loadPlanDetails(p.id)}>
                <div>
                   <div className="font-bold">{new Date(p.plan_month).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                   <div className="text-xs text-muted">{p.offices?.name}</div>
                </div>
                <span className={`badge ${p.status === 'approved' ? 'badge-success' : 'badge-gold'}`}>{p.status}</span>
             </div>
           ))}
        </div>

        {/* Main Details */}
        {/* Main Details */}
        <div className={styles.glassCard}>
           {activePlan ? (
              <>
                 <div className="flex-between mb-24">
                    <div>
                       <h2 className="text-2xl font-black text-white tracking-tight">Financial Intelligence Protocol</h2>
                       <p className="text-xs text-text-dim mt-1 font-bold uppercase tracking-widest">Plan Month: {new Date(activePlan.plan_month).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    </div>
                    {activePlan.status === 'pending' && (
                       <button className="btn btn-primary" onClick={() => setShowItemForm(true)}>
                          <Plus size={16} /> Request Funding
                       </button>
                    )}
                 </div>

                 <div className={styles.itemGrid}>
                    {activePlan.items?.map(item => {
                      const pClass = item.priority === 'urgent' ? styles.priorityUrgent :
                                   item.priority === 'high' ? styles.priorityHigh : 
                                   item.priority === 'medium' ? styles.priorityMed : styles.priorityLow;
                      return (
                        <div key={item.id} className={styles.expenditureCard}>
                           <div className={styles.itemHeader}>
                              <span className={styles.itemDept}>{item.position_or_department}</span>
                              <span className={`${styles.badge} ${pClass}`}>{item.priority}</span>
                           </div>
                           <h4 className={styles.itemPurpose}>{item.purpose}</h4>
                           <div className="mt-auto">
                              <div className={styles.itemCost}>$ {parseFloat(item.estimated_cost).toLocaleString()}</div>
                           </div>
                        </div>
                      );
                    })}
                    {(!activePlan.items || activePlan.items.length === 0) && (
                      <div className="col-span-full py-20 text-center border border-dashed border-white/5 rounded-[32px]">
                         <p className="text-text-dim font-bold uppercase tracking-widest text-[10px]">No funding requests initialized for this cycle</p>
                      </div>
                    )}
                 </div>

                 <div className={styles.summary}>
                    <div>
                       <p className="text-[10px] text-text-dim font-black mb-2 uppercase tracking-[0.2em]">Total Projected Allocation</p>
                       <div className="text-4xl font-black text-white">$ {totalEstimate.toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-6">
                       <div className="text-right">
                          <p className="text-[10px] text-text-dim font-black mb-1 uppercase tracking-widest text-gold">Status</p>
                          <p className="text-sm font-black text-white uppercase tracking-tighter">{activePlan.status}</p>
                       </div>
                       {isSuperAdmin(currentUser?.role) && activePlan.status === 'pending' && (
                          <div className="flex gap-12">
                             <button className="btn btn-secondary border-red-500/20 text-red-500 hover:bg-red-500/10" onClick={() => updateStatus('rejected')}>REJECT</button>
                             <button className="btn btn-primary shadow-gold" onClick={() => updateStatus('approved')}>APPROVE PROTOCOL</button>
                          </div>
                       )}
                    </div>
                 </div>
              </>
           ) : (
             <div className="h-full flex flex-center py-40 opacity-30">
                <div className="text-center">
                   <DollarSign size={64} className="mx-auto mb-6" />
                   <p className="font-black uppercase tracking-[0.2em] text-xs">Select Intelligence Cycle</p>
                </div>
             </div>
           )}
        </div>
      </div>

      {showItemForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowItemForm(false)}>
           <div className="modal">
              <div className="modal-header"><h2>Request New Budget Item</h2></div>
              <form onSubmit={addItem}>
                <div className="modal-body">
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                         <label className="form-label">Position / Department *</label>
                         <input className="form-input" required placeholder="e.g. Marketing Dept" value={itemForm.position_or_department} onChange={e => setItemForm({...itemForm, position_or_department: e.target.value})} />
                      </div>
                      <div className="form-group">
                         <label className="form-label">Priority</label>
                         <select className="form-select" value={itemForm.priority} onChange={e => setItemForm({...itemForm, priority: e.target.value})}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                         </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                         <label className="form-label">Purpose of Money *</label>
                         <input className="form-input" required placeholder="e.g. Buying new Facebook Advertisement credits" value={itemForm.purpose} onChange={e => setItemForm({...itemForm, purpose: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                         <label className="form-label">Estimated Cost ($) *</label>
                         <input type="number" className="form-input" required placeholder="e.g. 500" value={itemForm.estimated_cost} onChange={e => setItemForm({...itemForm, estimated_cost: e.target.value})} />
                      </div>
                   </div>
                </div>
                <div className="modal-footer">
                   <button type="button" className="btn btn-secondary" onClick={() => setShowItemForm(false)}>Cancel</button>
                   <button type="submit" className="btn btn-primary">Add to Plan</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
