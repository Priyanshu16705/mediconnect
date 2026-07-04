const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true,
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true,
  },
  startTime: { type: String, required: true }, // HH:MM
  endTime: { type: String, required: true },

  maxPatients: { type: Number, required: true, min: 1 },
  bookedCount: { type: Number, default: 0 },

  // Doctor can manually close/reopen any individual slot
  isOpen: { type: Boolean, default: true },
  closedReason: String,

  // For display label (e.g. "Morning", "Evening")
  session: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night'],
  },

  createdAt: { type: Date, default: Date.now },
});

// Compound index: one slot per doctor+date+time
slotSchema.index({ doctor: 1, date: 1, startTime: 1 }, { unique: true });

// Virtual: is slot full?
slotSchema.virtual('isFull').get(function () {
  return this.bookedCount >= this.maxPatients;
});

// Virtual: available seats
slotSchema.virtual('availableSeats').get(function () {
  return Math.max(0, this.maxPatients - this.bookedCount);
});

slotSchema.set('toJSON', { virtuals: true });
slotSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Slot', slotSchema);
