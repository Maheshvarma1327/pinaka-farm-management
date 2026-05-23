import { create } from 'zustand';

const MOCK_CASHBOOK = [
  {
    _id: "cash_1",
    transactionId: "TXN-001",
    date: "2026-05-15T00:00:00.000Z",
    type: "Income",
    category: "Animal Sale",
    description: "Sale of Grower G-101 to Ravi Shankar Farms",
    amount: 23875,
    paymentMethod: "UPI",
    referenceModule: "Sale",
    referenceId: "SL-001",
    balance: 23875,
    remarks: "",
    operator: "Admin",
    createdAt: "2026-05-15T10:00:00.000Z",
    isDeleted: false
  },
  {
    _id: "cash_2",
    transactionId: "TXN-002",
    date: "2026-05-10T00:00:00.000Z",
    type: "Expense",
    category: "Medicine Purchase",
    description: "Purchased Penicillin G batch BN-2025-A1",
    amount: 4500,
    paymentMethod: "Cash",
    referenceModule: "Medicine Purchase",
    referenceId: "MED-001",
    balance: 19375,
    remarks: "",
    operator: "Admin",
    createdAt: "2026-05-10T10:00:00.000Z",
    isDeleted: false
  }
];

const loadLocalCashBook = () => {
  const stored = localStorage.getItem('pinaka_cashbook');
  if (stored) {
    try { return JSON.parse(stored).filter(c => !c.isDeleted); }
    catch (e) { console.error("Decode failure:", e); }
  }
  localStorage.setItem('pinaka_cashbook', JSON.stringify(MOCK_CASHBOOK));
  return MOCK_CASHBOOK;
};

const saveLocalCashBook = (list) => localStorage.setItem('pinaka_cashbook', JSON.stringify(list));

export const useCashBookStore = create((set, get) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalCashBook();
      set({ transactions: list, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  addTransaction: async (data) => {
    set({ loading: true, error: null });
    try {
      const list = loadLocalCashBook();

      // Compute running balance
      const sorted = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
      const lastBalance = sorted.length > 0 ? sorted[sorted.length - 1].balance : 0;
      const newBalance = data.type === 'Income'
        ? lastBalance + Number(data.amount)
        : lastBalance - Number(data.amount);

      const newRecord = {
        _id: `cash_${Date.now()}`,
        transactionId: `TXN-${Date.now().toString().slice(-4)}`,
        ...data,
        amount: Number(data.amount),
        balance: newBalance,
        createdAt: new Date().toISOString(),
        isDeleted: false
      };

      const updatedList = [newRecord, ...list];
      saveLocalCashBook(updatedList);
      set({ transactions: updatedList, loading: false });
      return newRecord;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  }
}));
