import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  medicineId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Vaccine', 'Antibiotic', 'Dewormer', 'Vitamin', 'Other'],
    required: true
  },
  batchNumber: {
    type: String,
    required: true
  },
  supplier: {
    type: String,
    default: ''
  },
  purchaseDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  totalQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  usedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingStock: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    default: 'ml' // e.g., ml, doses, tablets
  },
  status: {
    type: String,
    enum: ['Available', 'Low Stock', 'Expired', 'Out Of Stock'],
    default: 'Available'
  },
  // Administration History Array embedded or referenced
  administrationHistory: [{
    animalId: String,
    dose: Number,
    dateAdministered: Date,
    administeredBy: String,
    linkedTreatmentId: String
  }],
  operator: {
    type: String,
    default: 'System'
  },
  notes: {
    type: String,
    default: ''
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Medicine = mongoose.model('Medicine', medicineSchema);
export default Medicine;
