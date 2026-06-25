const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    doctorName:      { type: String, required: true },
    patientName:     { type: String, required: true },
    patientId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    appointmentType: { type: String, required: true, enum: ['Consultation', 'Follow-up', 'Lab Result'] },
    appointmentTime: { type: Date }
}, { timestamps: true });

// Enforce unique appointment times per doctor to prevent race conditions
bookingSchema.index({ doctorName: 1, appointmentTime: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);
