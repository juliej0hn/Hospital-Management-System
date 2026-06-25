

const Doctor  = require('../models/Doctor');
const Booking = require('../models/Booking');
const User    = require('../models/User');
const bcrypt  = require('bcryptjs');
const {
    sendSlotsUpdatedEmail,
    sendCapacityReducedEmail,
    sendAppointmentCanceledEmail
} = require('../utils/email');


function parseTimeMins(timeStr) {
    const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    let h      = parseInt(match[1], 10);
    const m    = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
}


function calculateCapacity(timeSlot, avgTime) {
    try {
        const parts    = timeSlot.split(' - ');
        const startStr = parts[0].includes(', ')
            ? parts[0].substring(parts[0].lastIndexOf(', ') + 2)
            : parts[0];
        const endStr   = parts[1].trim();

        const startMins = parseTimeMins(startStr);
        const endMins   = parseTimeMins(endStr);
        if (startMins === null || endMins === null || endMins <= startMins) return 1;

        return Math.max(1, Math.floor((endMins - startMins) / avgTime));
    } catch (e) {
        return 1;
    }
}



exports.getLogin = async (req, res) => {
    try {
        const doctors = await Doctor.find({}, 'name').sort({ name: 1 });
        const error   = req.query.error || null;
        res.render('pages/doctor-login', { doctors, error });
    } catch (err) {
        console.error('doctor getLogin:', err);
        res.status(500).render('pages/error', { statusCode: 500, errorDetail: err.message });
    }
};



exports.postLogin = async (req, res) => {
    const { doctorName, password } = req.body;

    if (!doctorName || !password)
        return res.redirect('/doctor/login?error=missing');

    const doctor = await Doctor.findOne({ name: doctorName });
    if (!doctor)              return res.redirect('/doctor/login?error=notfound');
    
    const match = await bcrypt.compare(password, doctor.password);
    if (!match) return res.redirect('/doctor/login?error=invalid');

    req.session.doctorName = doctorName;
    res.redirect('/doctor/dashboard');
};




exports.getDashboard = async (req, res) => {
    if (!req.session.doctorName) return res.redirect('/doctor/login');

    try {
        const doctor = await Doctor.findOne({ name: req.session.doctorName });
        if (!doctor) {
            delete req.session.doctorName;
            return res.redirect('/doctor/login?error=notfound');
        }

        const bookings = await Booking.find({ doctorName: doctor.name }).sort({ createdAt: 1 });

        // Attach each patient's medical history and reports to their booking row
        const bookingsWithHistory = await Promise.all(bookings.map(async (b) => {
            const patient = await User.findById(b.patientId);
            return {
                ...b.toObject(),
                medicalHistory: patient ? patient.medicalHistory : []
            };
        }));

        res.render('pages/doctor-dashboard', { doctor, bookings: bookingsWithHistory });
    } catch (err) {
        console.error('doctor getDashboard:', err);
        res.status(500).render('pages/error', { statusCode: 500, errorDetail: err.message });
    }
};


exports.updateSlots = async (req, res) => {
    if (!req.session.doctorName) return res.json({ success: false, error: 'Unauthorized' });

    try {
        const { timeSlot }    = req.body;

      
        if (!timeSlot || typeof timeSlot !== 'string' || timeSlot.trim().length === 0)
            return res.json({ success: false, error: 'Time slot is required.' });

        const doctor          = await Doctor.findOne({ name: req.session.doctorName });
        const newCapacity     = calculateCapacity(timeSlot, doctor.avgConsultationTime);
        const currentBookings = await Booking.find({ doctorName: doctor.name }).sort({ createdAt: 1 });

      
        if (newCapacity < currentBookings.length) {
            const toRemove = currentBookings.slice(newCapacity);
            for (const b of toRemove) {
                const patient = await User.findById(b.patientId);
                if (patient) {
                    await sendCapacityReducedEmail({
                        patientEmail: patient.email,
                        patientName:  `${patient.firstName} ${patient.lastName}`,
                        clinicName:   doctor.name,
                        originalDate: doctor.timeSlot || 'your scheduled date'
                    });
                }
                await Booking.findByIdAndDelete(b._id);
            }
        }

        
        const remaining = await Booking.find({ doctorName: doctor.name });
        for (const b of remaining) {
            const patient = await User.findById(b.patientId);
            if (patient) {
                const slotParts = timeSlot.split(' - ');
                const newDate   = slotParts[0] || timeSlot;
                const newTime   = slotParts.length > 1 ? `${slotParts[0].split(', ').pop()} - ${slotParts[1]}` : timeSlot;
                await sendSlotsUpdatedEmail({
                    patientEmail: patient.email,
                    patientName: `${patient.firstName} ${patient.lastName}`,
                    doctorName:  doctor.name,
                    newDate,
                    newTime
                });
            }
        }

        doctor.timeSlot    = timeSlot;
        doctor.maxCapacity = newCapacity;
        await doctor.save();

        res.json({ success: true, newCapacity });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};



exports.clearSlot = async (req, res) => {
    if (!req.session.doctorName) return res.json({ success: false, error: 'Unauthorized' });

    try {
        const doctor   = await Doctor.findOne({ name: req.session.doctorName });
        const bookings = await Booking.find({ doctorName: doctor.name });
        
        for (const b of bookings) {
            const patient = await User.findById(b.patientId);
            if (patient) {
                await sendAppointmentCanceledEmail({
                    patientEmail:        patient.email,
                    patientName:        `${patient.firstName} ${patient.lastName}`,
                    doctorName:         doctor.name,
                    appointmentDate:    doctor.timeSlot || 'your scheduled date',
                    cancellationReason: 'Doctor schedule cleared — please rebook at your convenience'
                });
            }
        }

      
        await Booking.deleteMany({ doctorName: doctor.name });

        
        doctor.timeSlot    = '';
        doctor.maxCapacity = 0;
        await doctor.save();

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};


exports.logout = (req, res) => {
    delete req.session.doctorName;
    res.redirect('/doctor/login');
};
