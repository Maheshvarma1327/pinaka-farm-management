import mongoose from 'mongoose';

const breedingSchema = new mongoose.Schema({
  sowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sow',
    required: true
  },
  sowNo: {
    type: String,
    required: true
  },
  boarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boar',
    required: true
  },
  boarNo: {
    type: String,
    required: true
  },
  heatReferenceId: {
    type: String
  },
  heatDate: {
    type: Date
  },
  serviceDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  matingType: {
    type: String,
    enum: ['Natural Mating', 'Artificial Insemination (AI)', 'Hand Mating', 'Pen Mating'],
    default: 'Natural Mating'
  },
  operator: {
    type: String,
    default: 'System'
  },
  pregnancyCheckDate: {
    type: Date
  },
  pregnancyResult: {
    type: String,
    enum: ['Pending Confirmation', 'Pregnant Confirmed', 'Failed Breeding', 'Returned To Heat', 'Aborted'],
    default: 'Pending Confirmation'
  },
  expectedFarrowingDate: {
    type: Date
  },
  breedingStatus: {
    type: String,
    enum: [
      'Heat Detected', 
      'Service Scheduled', 
      'Pregnancy Pending', 
      'Pregnant Confirmed', 
      'Failed Breeding', 
      'Returned To Heat', 
      'Farrowing Expected', 
      'Closed'
    ],
    default: 'Pregnancy Pending'
  },
  notes: {
    type: String,
    default: ''
  },
  statusHistory: [{
    newStatus: String,
    updatedBy: String,
    updatedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Breeding = mongoose.model('Breeding', breedingSchema);

export default Breeding;
