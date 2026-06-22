'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/components/layout/AppLayout';
import { toast } from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function FinancePage() {
  const user = useUser();
  const [transactions, setTransactions] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [exporting, setExporting] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '',
    type: 'income',
    category: 'consultation_fee',
    amount: '',
    currency: 'USD',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    reference_number: '',
    description: '',
  });

  useEffect(() => {
    fetchFinanceData();
    fetchStudents();
  }, []);

  async function fetchFinanceData() {
    try {
      setLoading(true);
      const response = await fetch('/api/finance');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setTransactions(data.transactions || []);
      setCommissions(data.commissions || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load financial records');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudents() {
    try {
      const { data } = await supabase.from('students').select('id, full_name').order('full_name');
      setStudents(data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleRecordTransaction(e) {
    e.preventDefault();
    if (!formData.amount || !formData.payment_date) {
      toast.error('Amount and Date are required');
      return;
    }

    try {
      const response = await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      toast.success('Transaction logged successfully');
      setIsModalOpen(false);
      // Reset form
      setFormData({
        student_id: '',
        type: 'income',
        category: 'consultation_fee',
        amount: '',
        currency: 'USD',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        reference_number: '',
        description: '',
      });
      fetchFinanceData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Transaction submission failed');
    }
  }

  // Aggregate stats
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount_in_usd || t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount_in_usd || t.amount), 0);

  const netProfit = totalIncome - totalExpense;

  // Chart data aggregation (by category)
  const chartData = [
    { name: 'Income', USD: totalIncome },
    { name: 'Expense', USD: totalExpense },
    { name: 'Profit', USD: netProfit }
  ];

  // Excel mock export
  function handleExcelExport() {
    try {
      setExporting(true);
      // Simple CSV export string
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "ID,Type,Category,Amount,Currency,USD Equivalent,Payment Date,Method,Reference,Description\n";
      transactions.forEach(t => {
        csvContent += `"${t.id}","${t.type}","${t.category}",${t.amount},"${t.currency}",${t.amount_in_usd},"${t.payment_date}","${t.payment_method}","${t.reference_number}","${t.description}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `GT_Finance_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Excel/CSV export completed!');
    } catch (err) {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-gold">💵</span> Financial Management
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Track consultation fees, university commissions, office operational expenses, and generated profit.
          </p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <button
            onClick={handleExcelExport}
            className="border border-gold/30 text-gold hover:bg-gold/10 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          >
            Export CSV
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2 rounded-lg text-sm transition-all"
          >
            ＋ Record Transaction
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-2 border border-white/5 rounded-xl p-6 shadow-lg">
              <p className="text-white/50 text-xs font-semibold uppercase">Total Income (USD Equivalent)</p>
              <h2 className="text-3xl font-bold text-success font-display mt-2">${totalIncome.toFixed(2)}</h2>
            </div>
            <div className="bg-surface-2 border border-white/5 rounded-xl p-6 shadow-lg">
              <p className="text-white/50 text-xs font-semibold uppercase">Total Expenses (USD Equivalent)</p>
              <h2 className="text-3xl font-bold text-danger font-display mt-2">${totalExpense.toFixed(2)}</h2>
            </div>
            <div className="bg-surface-2 border border-white/5 rounded-xl p-6 shadow-lg">
              <p className="text-white/50 text-xs font-semibold uppercase">Net Operating Profit</p>
              <h2 className={`text-3xl font-bold font-display mt-2 ${netProfit >= 0 ? 'text-gold' : 'text-danger'}`}>
                ${netProfit.toFixed(2)}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Chart */}
            <div className="lg:col-span-1 bg-surface-2 border border-white/5 rounded-xl p-6 flex flex-col justify-between min-h-[300px]">
              <h3 className="font-display text-sm font-bold text-white border-b border-white/5 pb-2">Financial Breakdown</h3>
              <div className="flex-1 mt-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#252928" />
                    <XAxis dataKey="name" stroke="#9A9EA8" />
                    <YAxis stroke="#9A9EA8" />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="USD" fill="#EFB748" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Commission Tracker */}
            <div className="lg:col-span-2 bg-surface-2 border border-white/5 rounded-xl p-6 space-y-4">
              <h3 className="font-display text-sm font-bold text-white border-b border-white/5 pb-2">University Commissions Status</h3>
              <div className="overflow-x-auto max-h-[220px]">
                {commissions.length === 0 ? (
                  <p className="text-white/30 text-xs text-center py-12">No university commission records found.</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-white/50 uppercase font-semibold">
                        <th className="py-2 px-3">University</th>
                        <th className="py-2 px-3">Student</th>
                        <th className="py-2 px-3">Commission Rate</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((comm) => (
                        <tr key={comm.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="py-2 px-3 text-white font-semibold">{comm.universities?.name}</td>
                          <td className="py-2 px-3 text-white/80">{comm.students?.full_name}</td>
                          <td className="py-2 px-3 text-white/60">{comm.commission_rate}%</td>
                          <td className="py-2 px-3 font-semibold text-gold">${comm.amount}</td>
                          <td className="py-2 px-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                              comm.status === 'paid' ? 'bg-success/20 text-success border-success/30' :
                              comm.status === 'disputed' ? 'bg-danger/20 text-danger border-danger/30' :
                              'bg-warning/20 text-warning border-warning/30'
                            }`}>
                              {comm.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Transactions Log */}
          <div className="bg-surface-2 border border-white/5 rounded-xl p-6 space-y-4">
            <h3 className="font-display text-sm font-bold text-white border-b border-white/5 pb-2">Operational Transactions Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-white/50 uppercase font-semibold">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Student Context</th>
                    <th className="py-3 px-4">Recorded By</th>
                    <th className="py-3 px-4">Method / Ref</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((trans) => (
                    <tr key={trans.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                      <td className="py-3 px-4 text-white/70">{trans.payment_date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          trans.type === 'income' ? 'bg-success/20 text-success border-success/30' :
                          'bg-danger/20 text-danger border-danger/30'
                        }`}>
                          {trans.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white capitalize">{trans.category.replace('_', ' ')}</td>
                      <td className="py-3 px-4 text-white/70">{trans.students?.full_name || 'General Operations'}</td>
                      <td className="py-3 px-4 text-white/60">{trans.users?.full_name || 'N/A'}</td>
                      <td className="py-3 px-4 text-white/50 text-[10px]">
                        <div>{trans.payment_method.toUpperCase()}</div>
                        <div className="font-mono text-white/30">{trans.reference_number || 'No Ref'}</div>
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold font-display text-sm ${trans.type === 'income' ? 'text-success' : 'text-danger'}`}>
                        {trans.type === 'income' ? '+' : '-'}${trans.amount} <span className="text-[10px] text-white/40">{trans.currency}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Record Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-surface-2 border border-gold/20 rounded-xl max-w-md w-full p-6 space-y-6 animate-slide-up">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="font-display text-xl font-bold text-white">Record Transaction</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white text-2xl">&times;</button>
            </div>

            <form onSubmit={handleRecordTransaction} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-white/70 text-xs font-semibold">Transaction Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                  >
                    <option value="income">Income / Deposit</option>
                    <option value="expense">Expense / Withdrawal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-white/70 text-xs font-semibold">Category</label>
                  {formData.type === 'income' ? (
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                    >
                      <option value="consultation_fee">Consultation Fee</option>
                      <option value="application_fee">Application Fee</option>
                      <option value="visa_fee">Visa Processing Fee</option>
                      <option value="service_fee">Service Fee</option>
                      <option value="commission">University Commission</option>
                    </select>
                  ) : (
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                    >
                      <option value="rent">Office Rent</option>
                      <option value="salary">Staff Salary</option>
                      <option value="utilities">Office Utilities</option>
                      <option value="marketing">Marketing & Ads</option>
                      <option value="travel">Travel & Business</option>
                      <option value="supplies">Office Supplies</option>
                      <option value="other">Other Operational</option>
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-white/70 text-xs font-semibold">Amount *</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 500"
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-white/70 text-xs font-semibold">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="BDT">BDT (৳)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">Associate Student (Optional)</label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                >
                  <option value="">-- No Student Associated --</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>{st.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-white/70 text-xs font-semibold">Payment Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-white/70 text-xs font-semibold">Payment Method</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                    className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gold/50 w-full text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
                    <option value="card">Credit/Debit Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">Reference Number / TxID</label>
                <input
                  type="text"
                  value={formData.reference_number}
                  onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
                  placeholder="e.g. TXN10298374"
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-white/70 text-xs font-semibold">Description / Notes</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Additional remarks..."
                  className="bg-surface-3 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-gold/50 w-full text-sm"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="border border-white/10 text-white/70 hover:bg-white/5 px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2 rounded-lg text-sm transition-all"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
