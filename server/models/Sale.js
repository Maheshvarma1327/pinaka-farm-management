import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  saleId: { type: String, required: true, unique: true },
  saleDate: { type: Date, required: true },
  animalId: { type: String, required: true },
  animalType: { type: String, required: true },
  sex: { type: String, required: true },
  weight: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  buyerName: { type: String, required: true },
  buyerContact: { type: String, default: '' },
  challanNumber: { type: String, default: '' },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Partial'],
    default: 'Pending'
  },
  amountPaid: { type: Number, default: 0 },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Bank Transfer', 'Credit'],
    default: 'Cash'
  },
  remarks: { type: String, default: '' },
  operator: { type: String, default: 'System' },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

const Sale = mongoose.model('Sale', saleSchema);
export default Sale;
