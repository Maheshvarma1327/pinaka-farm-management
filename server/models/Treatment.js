import mongoose from 'mongoose';

const treatmentSchema = new mongoose.Schema({
  treatmentId: {
    type: String,
    required: true,
    unique: true
  },
  animalId: {
    type: String,
    required: true
  },
  animalType: {
    type: String,
    required: true
  },
  symptoms: {
    type: String,
    required: true
  },
  diagnosis: {
    type: String,
    required: true
  },
  treatmentDetails: {
    type: String,
    required: true
  },
  vetName: {
    type: String,
    default: 'In-house Vet'
  },
  startDate: {
    type: Date,
    required: true
  },
  followUpDate: {
    type: Date
  },
  recoveryStatus: {
    type: String,
    enum: [
      'Under Observation',
      'Under Treatment',
      'Recovering',
      'Recovered',
      'Critical',
      'Dead'
    ],
    default: 'Under Observation'
  },
  medicinesUsed: [{
    medicineId: String,
    medicineName: String,
    dose: String
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

const Treatment = mongoose.model('Treatment', treatmentSchema);
export default Treatment;
