import mongoose from 'mongoose';

const farrowingSchema = new mongoose.Schema({
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
    ref: 'Boar'
  },
  boarNo: {
    type: String,
    default: 'UNKNOWN'
  },
  breedingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Breeding'
  },
  serviceDate: {
    type: Date
  },
  expectedFarrowingDate: {
    type: Date
  },
  actualFarrowingDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Litter Outcomes
  pigletsBornAlive: {
    type: Number,
    required: true,
    min: 0
  },
  stillbornPiglets: {
    type: Number,
    default: 0,
    min: 0
  },
  mummifiedPiglets: {
    type: Number,
    default: 0,
    min: 0
  },
  weakPiglets: {
    type: Number,
    default: 0,
    min: 0
  },
  totalLitterSize: {
    type: Number,
    required: true,
    min: 0
  },
  birthComplications: {
    type: String,
    default: ''
  },
  
  // Weaning
  expectedWeaningDate: {
    type: Date
  },
  actualWeaningDate: {
    type: Date
  },
  pigletsWeaned: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Lifecycle Status
  lactationStatus: {
    type: String,
    enum: [
      'Farrowing Due', 
      'In Labor', 
      'Farrowed', 
      'Lactating', 
      'Weaning Due', 
      'Weaned', 
      'Closed'
    ],
    default: 'Lactating'
  },
  pigletsTransferredToGrower: {
    type: Boolean,
    default: false
  },
  
  // Piglet Roster (During Lactation)
  piglets: [{
    pigletId: { type: String, required: true },
    sex: { type: String, enum: ['Male', 'Female', 'Unknown'], default: 'Unknown' },
    birthWeight: { type: Number, default: 0 },
    currentWeight: { type: Number, default: 0 },
    status: { type: String, enum: ['Nursing', 'Weaned', 'Dead', 'Transferred'], default: 'Nursing' },
    notes: { type: String, default: '' }
  }],
  
  // Litter Health Log (Vaccines, Medicines)
  healthLog: [{
    type: { type: String, enum: ['Vaccine', 'Medicine', 'Treatment'], default: 'Vaccine' },
    name: { type: String, required: true },
    dateAdministered: { type: Date, required: true, default: Date.now },
    dose: { type: String, default: '' },
    operator: { type: String, default: 'System' },
    notes: { type: String, default: '' }
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

// Calculate total litter size before save if not manually provided accurately
farrowingSchema.pre('validate', function(next) {
  this.totalLitterSize = (this.pigletsBornAlive || 0) + (this.stillbornPiglets || 0) + (this.mummifiedPiglets || 0);
  
  if (this.actualFarrowingDate && !this.expectedWeaningDate) {
    // Expected weaning ~60 days from actual birth
    const weanDate = new Date(this.actualFarrowingDate);
    weanDate.setDate(weanDate.getDate() + 60);
    this.expectedWeaningDate = weanDate;
  }
  
  next();
});

const Farrowing = mongoose.model('Farrowing', farrowingSchema);

export default Farrowing;
