import mongoose from 'mongoose';

const mortalitySchema = new mongoose.Schema({
  mortalityId: {
    type: String,
    required: true,
    unique: true
  },
  animalId: {
    type: String,
    required: true
  },
  lifecycleStage: {
    type: String,
    required: true
  },
  penNumber: {
    type: String,
    default: ''
  },
  ageAtDeath: {
    type: Number, // in days or months
  },
  sex: {
    type: String,
    required: true
  },
  causeOfDeath: {
    type: String,
    required: true
  },
  postmortemFindings: {
    type: String,
    default: ''
  },
  dateOfDeath: {
    type: Date,
    required: true
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

const Mortality = mongoose.model('Mortality', mortalitySchema);
export default Mortality;
