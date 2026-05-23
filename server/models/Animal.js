import mongoose from 'mongoose';

const animalSchema = new mongoose.Schema({
  animalNo: {
    type: String,
    required: true,
    unique: true
  },
  earTag: {
    type: String,
    default: ''
  },
  dob: {
    type: Date,
    required: true
  },
  sex: {
    type: String,
    enum: ['Male', 'Female', 'Unknown'],
    required: true
  },
  breed: {
    type: String,
    required: true
  },
  currentWeight: {
    type: Number,
    required: true,
    min: 0
  },
  source: {
    type: String,
    enum: ['Farm Born', 'Purchased', 'Imported', 'Grower Promotion'],
    default: 'Farm Born'
  },
  supplier: {
    type: String,
    default: ''
  },
  
  // Master Lifecycle Placement
  lifecycleStage: {
    type: String,
    enum: [
      'Piglet', 
      'Grower', 
      'Breeding Candidate',
      'Sow', 
      'Boar', 
      'Sold', 
      'Dead', 
      'Retired'
    ],
    default: 'Piglet'
  },
  currentPen: {
    type: String,
    default: 'Unassigned'
  },
  
  // Operational Intelligence
  operationalStatus: {
    type: String,
    enum: [
      'Active',
      'Under Treatment',
      'Under Observation',
      'Recovering',
      'Critical',
      'Pregnant',
      'Lactating',
      'Waiting For Heat',
      'Culled'
    ],
    default: 'Active'
  },
  
  // Ownership References (When an animal is a Sow or Boar, it references those detailed records)
  sowRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sow',
    default: null
  },
  boarRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Boar',
    default: null
  },
  growerRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Grower',
    default: null
  },
  
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

const Animal = mongoose.model('Animal', animalSchema);

export default Animal;
