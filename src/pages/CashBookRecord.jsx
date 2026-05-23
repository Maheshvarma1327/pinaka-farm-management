import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useCashBookStore } from '../store/useCashBookStore';
import DataTable from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import { TableSkeleton, CardSkeleton } from '../components/ui/LoadingSkeleton';
import Modal from '../components/ui/Modal';
import { FormField, FormGrid, FormSection } from '../components/ui/FormLayout';
import { Wallet, Plus, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export default function CashBookRecord() {
  const { transactions, loading, fetchTransactions, addTransaction } = useCashBookStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'Expense', category: 'Farm Operations', description: '',
    amount: '', paymentMethod: 'Cash', referenceModule: 'Other', remarks: ''
  });

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const kpis = useMemo(() => {
    const income = transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;
    return { income, expense, balance, count: transactions.length };
  }, [transactions]);

  // Sort by date descending and compute running balances
  const sortedTransactions = useMemo(() =>
    [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions]
  );

  const columns = useMemo(() => [
    {
      header: "TXN ID", accessor: "transactionId", sortable: true,
      render: (val) => <span className="font-extrabold text-primary font-mono text-[11px]">{val}</span>
    },
    {
      header: "Date", accessor: "date", sortable: true,
      render: (val) => <span className="text-[11px] text-textSecondary">{val ? new Date(val).toLocaleDateString() : 'N/A'}</span>
    },
    {
      header: "Type", accessor: "type",
      render: (val) => (
        <span className={`flex items-center gap-1.5 font-black text-[11px] uppercase tracking-wider ${val === 'Income' ? 'text-success' : 'text-danger'}`}>
          {val === 'Income' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
          {val}
        </span>
      )
    },
    { header: "Category", accessor: "category", render: (val) => <span className="text-[11px] text-textSecondary">{val}</span> },
    {
      header: "Description", accessor: "description",
      render: (val) => <span className="text-[11px] text-textPrimary max-w-[200px] block truncate">{val}</span>
    },
    {
      header: "Amount (₹)", accessor: "amount", sortable: true,
      render: (val, row) => (
        <span className={`font-black text-[12px] ${row.type === 'Income' ? 'text-success' : 'text-danger'}`}>
          {row.type === 'Income' ? '+' : '-'}₹{val?.toLocaleString('en-IN')}
        </span>
      )
    },
    {
      header: "Balance (₹)", accessor: "balance",
      render: (val) => <span className={`font-black text-[12px] ${val >= 0 ? 'text-blueAccent' : 'text-danger'}`}>₹{val?.toLocaleString('en-IN')}</span>
    },
    { header: "Method", accessor: "paymentMethod", render: (val) => <span className="text-[10px] font-bold text-textSecondary uppercase">{val}</span> },
  ], []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addTransaction({ ...formData, operator: 'System' });
      setIsAddModalOpen(false);
      setFormData({ date: new Date().toISOString().split('T')[0], type: 'Expense', category: 'Farm Operations', description: '', amount: '', paymentMethod: 'Cash', referenceModule: 'Other', remarks: '' });
    } catch (err) { alert(err.message); }
  };

  const expenseCategories = ['Farm Operations', 'Medicine Purchase', 'Equipment', 'Utilities', 'Maintenance', 'Labour', 'Transport', 'Other'];
  const incomeCategories = ['Animal Sale', 'External Revenue', 'Other'];

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-textPrimary uppercase tracking-widest flex items-center gap-2">
              <Wallet className="w-6 h-6 text-blueAccent" /> Cash Book
            </h2>
            <p className="text-xs text-textSecondary mt-1">Income, expenses, and running cash flow — auto-connected to sales and medicine purchases.</p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2 text-xs py-2 px-4 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Add Transaction
          </button>
        </div>

        {loading && transactions.length === 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="op-card p-4 flex items-center justify-between col-span-2 lg:col-span-1">
              <div>
                <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold mb-1">Net Balance</p>
                <p className={`text-2xl font-black ${kpis.balance >= 0 ? 'text-success' : 'text-danger'}`}>
                  ₹{kpis.balance.toLocaleString('en-IN')}
                </p>
              </div>
              <div className={`w-10 h-10 rounded flex items-center justify-center border ${kpis.balance >= 0 ? 'bg-success/10 border-success/20' : 'bg-danger/10 border-danger/20'}`}>
                <Wallet className={`w-5 h-5 ${kpis.balance >= 0 ? 'text-success' : 'text-danger'}`} />
              </div>
            </div>
            <div className="op-card p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold mb-1">Total Income</p>
                <p className="text-xl font-black text-success">₹{kpis.income.toLocaleString('en-IN')}</p>
              </div>
              <div className="w-10 h-10 rounded bg-success/10 flex items-center justify-center border border-success/20">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
            </div>
            <div className="op-card p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold mb-1">Total Expenses</p>
                <p className="text-xl font-black text-danger">₹{kpis.expense.toLocaleString('en-IN')}</p>
              </div>
              <div className="w-10 h-10 rounded bg-danger/10 flex items-center justify-center border border-danger/20">
                <TrendingDown className="w-5 h-5 text-danger" />
              </div>
            </div>
            <div className="op-card p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-textSecondary uppercase tracking-widest font-bold mb-1">Transactions</p>
                <p className="text-2xl font-black text-blueAccent">{kpis.count}</p>
              </div>
              <div className="w-10 h-10 rounded bg-blueAccent/10 flex items-center justify-center border border-blueAccent/20">
                <ArrowUpRight className="w-5 h-5 text-blueAccent" />
              </div>
            </div>
          </div>
        )}

        <div className="op-card border border-borderDark rounded-xl overflow-hidden">
          {loading && transactions.length === 0 ? <TableSkeleton rows={5} cols={8} /> : (
            <DataTable columns={columns} data={sortedTransactions} searchPlaceholder="Search by description, category..." />
          )}
        </div>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Transaction" icon={<Wallet className="w-5 h-5 text-blueAccent" />}>
        <form onSubmit={handleAdd} className="flex flex-col gap-5 p-1">
          <FormSection title="Transaction Details">
            <FormGrid cols={2}>
              <FormField label="Date" required id="txnDate">
                <input id="txnDate" type="date" required className="input-field" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
              </FormField>
              <FormField label="Type" required id="txnType">
                <select id="txnType" className="input-field" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value, category: e.target.value === 'Income' ? 'Animal Sale' : 'Farm Operations' })}>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </FormField>
            </FormGrid>
            <FormGrid cols={2}>
              <FormField label="Category" required id="txnCategory">
                <select id="txnCategory" className="input-field" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  {(formData.type === 'Income' ? incomeCategories : expenseCategories).map(c => <option key={c}>{c}</option>)}
                </select>
              </FormField>
              <FormField label="Amount (₹)" required id="txnAmount">
                <input id="txnAmount" type="number" min="0" required className="input-field" placeholder="0" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
              </FormField>
            </FormGrid>
            <FormField label="Description" required id="txnDesc">
              <input id="txnDesc" type="text" required className="input-field" placeholder="Brief description..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </FormField>
            <FormGrid cols={2}>
              <FormField label="Payment Method" id="txnPayMethod">
                <select id="txnPayMethod" className="input-field" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                  {['Cash', 'UPI', 'Bank Transfer', 'Credit'].map(m => <option key={m}>{m}</option>)}
                </select>
              </FormField>
              <FormField label="Reference Module" id="txnRefModule">
                <select id="txnRefModule" className="input-field" value={formData.referenceModule} onChange={e => setFormData({ ...formData, referenceModule: e.target.value })}>
                  {['Sale', 'Medicine Purchase', 'Farm Operations', 'Utilities', 'Equipment', 'Maintenance', 'Other'].map(r => <option key={r}>{r}</option>)}
                </select>
              </FormField>
            </FormGrid>
          </FormSection>
          <div className="flex justify-end gap-3 pt-4 border-t border-borderDark">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-bold text-textSecondary hover:text-textPrimary transition-colors">Cancel</button>
            <button type="submit" className="btn-primary py-2 px-6">Add Transaction</button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}
