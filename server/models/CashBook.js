import mongoose from 'mongoose';

const cashBookSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  type: {
    type: String,
    enum: ['Income', 'Expense'],
    required: true
  },
  category: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Credit'],
    default: 'Cash'
  },
  referenceModule: {
    type: String,
    enum: ['Sale', 'Medicine Purchase', 'Farm Operations', 'Utilities', 'Equipment', 'Maintenance', 'Other'],
    default: 'Other'
  },
  referenceId: { type: String, default: '' },
  balance: { type: Number, default: 0 },
  remarks: { type: String, default: '' },
  operator: { type: String, default: 'System' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const CashBook = mongoose.model('CashBook', cashBookSchema);
export default CashBook;
