'use client';

import React, { useState, useEffect } from 'react';
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
import { isSuperAdmin } from '@/lib/auth';
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Expenditure Planning</h1>
          <p className="page-subtitle">Strategic monthly budget requests and forecasting</p>
        </div>
        <button className="btn btn-primary" onClick={createPlan}>
           <TrendingUp size={18} /> Plan Next Month
        </button>
      </div>

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
        <div className="card" style={{ padding: '2rem' }}>
           {activePlan ? (
              <>
                 <div className="flex-between mb-24">
                    <div>
                       <h2 className="text-xl font-bold">Plan Details</h2>
                       <p className="text-xs text-muted">Approval Status: <span className="text-gold">{activePlan.status}</span></p>
                    </div>
                    {activePlan.status === 'pending' && (
                       <button className="btn btn-secondary btn-sm" onClick={() => setShowItemForm(true)}>
                          <Plus size={16} /> Request Funding Item
                       </button>
                    )}
                 </div>

                 <table className={styles.detailTable}>
                    <thead>
                       <tr>
                          <th>Position/Dept</th>
                          <th>Purpose</th>
                          <th>Priority</th>
                          <th style={{ textAlign: 'right' }}>Est. Cost</th>
                       </tr>
                    </thead>
                    <tbody>
                       {activePlan.items?.map(item => (
                         <tr key={item.id}>
                            <td className="text-sm font-bold">{item.position_or_department}</td>
                            <td className="text-sm">{item.purpose}</td>
                            <td>
                               <span className={`${styles.badge} ${
                                 item.priority === 'urgent' ? styles.priorityUrgent :
                                 item.priority === 'high' ? styles.priorityHigh : styles.priorityMed
                               }`}>
                                 {item.priority}
                               </span>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: '800' }}>${parseFloat(item.estimated_cost).toFixed(2)}</td>
                         </tr>
                       ))}
                    </tbody>
                 </table>

                 <div className={styles.summary}>
                    <div>
                       <p className="text-xs text-muted mb-4 uppercase">Total Projected Budget</p>
                       <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>$ {totalEstimate.toFixed(2)}</div>
                    </div>
                    {isSuperAdmin(currentUser?.role) && activePlan.status === 'pending' && (
                       <div className="flex gap-12">
                          <button className="btn btn-secondary" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={() => updateStatus('rejected')}>REJECT</button>
                          <button className="btn btn-primary" onClick={() => updateStatus('approved')}>APPROVE PLAN</button>
                       </div>
                    )}
                 </div>
              </>
           ) : (
             <div className="empty-state">Select a month to view the detailed plan</div>
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
