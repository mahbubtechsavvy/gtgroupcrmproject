'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Send, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  User, 
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/auth';
import styles from './expenses.module.css';

export default function ExpenseReportsPage() {
  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [staff, setStaff] = useState([]);
  const [itemForm, setItemForm] = useState({
    item_date: new Date().toISOString().split('T')[0],
    details: '',
    specification: '',
    income_amount: 0,
    expense_amount: 0,
    fund_user: '',
    purpose: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (selectedId = null) => {
    const supabase = getSupabaseClient();
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: user } = await supabase.from('users').select('*').eq('id', session.user.id).single();
      setCurrentUser(user);

      const res = await fetch(`/api/expenses?officeId=${user.role.startsWith('ceo') ? '' : user.office_id}`);
      const data = await res.json();
      setReports(data || []);

      if (selectedId || (data?.length > 0 && !activeReport)) {
        loadReportDetails(selectedId || data[0].id);
      }

      const { data: staffData } = await supabase.from('users').select('id, full_name, employee_id');
      setStaff(staffData || []);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReportDetails = async (id) => {
    const res = await fetch(`/api/expenses?reportId=${id}`);
    const data = await res.json();
    setActiveReport(data);
  };

  const createReport = async () => {
    const month = prompt("Enter Month (YYYY-MM-01)", new Date().toISOString().split('T')[0]);
    if (!month) return;

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'create_report',
          report_data: {
            office_id: currentUser.office_id,
            report_month: month,
            status: 'draft'
          }
        })
      });
      if (res.ok) fetchData();
    } catch (err) { alert('Failed to create report'); }
  };

  const addItem = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'add_item',
          items_data: { ...itemForm, report_id: activeReport.id }
        })
      });
      if (res.ok) {
        setShowItemForm(false);
        loadReportDetails(activeReport.id);
      }
    } catch (err) { alert('Failed to add item'); }
  };

  const submitReport = async () => {
    const today = new Date().getDate();
    if (today < 28) {
      if (!confirm("Your notebook says to submit on the 30th/last day. Are you sure you want to submit early?")) return;
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'submit_report', report_id: activeReport.id })
      });
      if (res.ok) loadReportDetails(activeReport.id);
    } catch (err) { alert('Failed to submit'); }
  };

  const approveReport = async (status) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            mode: 'approve_report', 
            report_id: activeReport.id, 
            status, 
            admin_id: currentUser.id 
        })
      });
      if (res.ok) loadReportDetails(activeReport.id);
    } catch (err) { alert('Failed to update status'); }
  };

  const calculateTotals = () => {
    if (!activeReport?.items) return { income: 0, expense: 0, remaining: 0 };
    const income = activeReport.items.reduce((acc, i) => acc + parseFloat(i.income_amount || 0), 0);
    const expense = activeReport.items.reduce((acc, i) => acc + parseFloat(i.expense_amount || 0), 0);
    return { income, expense, remaining: income - expense };
  };

  if (loading) return <div className="empty-state">Loading Financial Reports...</div>;

  const totals = calculateTotals();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className="page-title">Expense Reports</h1>
          <p className="page-subtitle">Monthly financial submission & audit logs</p>
        </div>
        <button className="btn btn-primary" onClick={createReport}>
           <Plus size={18} /> New Monthly Report
        </button>
      </div>

      {activeReport && (
        <div className={styles.summaryCards}>
          <div className={styles.card}>
            <p className="text-xs text-muted mb-4 uppercase">Total Income</p>
            <div style={{ color: '#22c55e', fontSize: '1.5rem', fontWeight: 'bold' }}>+ ${totals.income.toFixed(2)}</div>
          </div>
          <div className={styles.card}>
            <p className="text-xs text-muted mb-4 uppercase">Total Expenses</p>
            <div style={{ color: '#ef4444', fontSize: '1.5rem', fontWeight: 'bold' }}>- ${totals.expense.toFixed(2)}</div>
          </div>
          <div className={`${styles.card} ${totals.remaining < 0 ? 'border-danger' : 'border-gold'}`}>
            <p className="text-xs text-muted mb-4 uppercase">Remaining Balance</p>
            <div style={{ color: 'var(--color-gold)', fontSize: '1.5rem', fontWeight: 'bold' }}>$ {totals.remaining.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className={styles.reportLayout}>
        {/* Sidebar: List of months */}
        <div className={styles.sidebar}>
          <h3 className="text-sm font-bold mb-16 text-gold">REPORTS HISTORY</h3>
          {reports.map(r => (
            <div key={r.id} className={`${styles.reportItem} ${activeReport?.id === r.id ? styles.active : ''}`} onClick={() => loadReportDetails(r.id)}>
               <div>
                  <div className="font-bold">{new Date(r.report_month).toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
                  <div className="text-xs text-muted font-mono">{r.offices?.name}</div>
               </div>
               <span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'submitted' ? 'badge-gold' : 'badge-muted'}`}>
                  {r.status}
               </span>
            </div>
          ))}
        </div>

        {/* Main Area: Line items */}
        <div className={styles.mainContent}>
          {activeReport ? (
            <>
              <div className="flex-between mb-24">
                 <div>
                    <h2 className="text-xl font-bold">{new Date(activeReport.report_month).toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
                    <p className="text-xs text-muted">Status: <span className="text-gold capitalize">{activeReport.status}</span></p>
                 </div>
                 {activeReport.status === 'draft' && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowItemForm(true)}>
                       <Plus size={16} /> Add Line Item
                    </button>
                 )}
              </div>

              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Detail & Purpose</th>
                    <th>Fund User</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {activeReport.items?.map(item => (
                    <tr key={item.id}>
                      <td className="text-xs text-muted font-mono">{item.item_date}</td>
                      <td>
                        <div className="font-bold">{item.details}</div>
                        <div className="text-xs text-muted italic">{item.purpose}</div>
                      </td>
                      <td>
                        <div className="flex items-center gap-4 text-xs">
                          <User size={12} />
                          {item.fund_user_user?.full_name}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                         <span className={item.income_amount > 0 ? styles.incomeRow : styles.expenseRow}>
                            {item.income_amount > 0 ? `+${item.income_amount}` : `-${item.expense_amount}`}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.footer}>
                 <div className="flex items-center gap-8 text-xs text-muted">
                    <AlertCircle size={14} />
                    Finalized reports are sent to the Super Admin for verification.
                 </div>
                 <div className="flex gap-8">
                    {activeReport.status === 'draft' && (
                      <button className="btn btn-primary" onClick={submitReport}>
                         <Send size={16} /> Submit Report
                      </button>
                    )}
                    {isSuperAdmin(currentUser?.role) && activeReport.status === 'submitted' && (
                       <div className="flex gap-8">
                          <button className="btn btn-primary" onClick={() => approveReport('approved')}>Approve</button>
                          <button className="btn btn-danger" onClick={() => approveReport('rejected')}>Reject</button>
                       </div>
                    )}
                 </div>
              </div>
            </>
          ) : (
            <div className="empty-state">Select a month to view the expense report</div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {showItemForm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowItemForm(false)}>
           <div className="modal">
              <div className="modal-header"><h2>Add Financial Record</h2></div>
              <form onSubmit={addItem}>
                <div className="modal-body">
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div style={{ gridColumn: '1 / -1' }}>
                         <label className="form-label">Details *</label>
                         <input className="form-input" required placeholder="e.g. Monthly Rent for Bangladesh Office" value={itemForm.details} onChange={e => setItemForm({...itemForm, details: e.target.value})} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                         <label className="form-label">Specification</label>
                         <input className="form-input" placeholder="e.g. Includes security deposit and utility bills" value={itemForm.specification} onChange={e => setItemForm({...itemForm, specification: e.target.value})} />
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                         <label className="form-label">Purpose of Money *</label>
                         <input className="form-input" required placeholder="e.g. Running office space costs" value={itemForm.purpose} onChange={e => setItemForm({...itemForm, purpose: e.target.value})} />
                      </div>
                      <div>
                         <label className="form-label">Income (+)</label>
                         <input type="number" className="form-input" placeholder="0.00" value={itemForm.income_amount} onChange={e => setItemForm({...itemForm, income_amount: e.target.value, expense_amount: 0})} />
                      </div>
                      <div>
                         <label className="form-label">Expense (-)</label>
                         <input type="number" className="form-input" placeholder="0.00" value={itemForm.expense_amount} onChange={e => setItemForm({...itemForm, expense_amount: e.target.value, income_amount: 0})} />
                      </div>
                      <div>
                         <label className="form-label">Date</label>
                         <input type="date" className="form-input" value={itemForm.item_date} onChange={e => setItemForm({...itemForm, item_date: e.target.value})} />
                      </div>
                      <div>
                         <label className="form-label">Fund User (Money Handler) *</label>
                         <select className="form-select" required value={itemForm.fund_user} onChange={e => setItemForm({...itemForm, fund_user: e.target.value})}>
                            <option value="">Select Staff</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                         </select>
                      </div>
                   </div>
                </div>
                <div className="modal-footer">
                   <button type="button" className="btn btn-secondary" onClick={() => setShowItemForm(false)}>Cancel</button>
                   <button type="submit" className="btn btn-primary">Add Row</button>
                </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
