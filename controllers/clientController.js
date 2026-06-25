const Doctor  = require('../models/Doctor');
const Booking = require('../models/Booking');
const User    = require('../models/User');

function parseTimeMins(timeStr) {
    const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    let h  = parseInt(match[1], 10);
    const m  = parseInt(match[2], 10);
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { h, m };
}

function getAppointmentTime(timeSlot, avgTime, position) {
    try {
        const parts    = timeSlot.split(' - ');
        const startStr = parts[0].includes(', ')
            ? parts[0].substring(parts[0].lastIndexOf(', ') + 2)
            : parts[0];

        const parsed = parseTimeMins(startStr);
        if (!parsed) return new Date();

        const now = new Date();
        now.setHours(parsed.h, parsed.m + position * avgTime, 0, 0);
        return now;
    } catch (e) {
        return new Date();
    }
}

exports.getDashboard = async (req, res) => {
    try {
        const doctors  = await Doctor.find().sort({ name: 1 });
        const bookings = await Booking.find().sort({ createdAt: 1 });
        const user     = await User.findById(req.session.user.id);

        const myBookings = bookings
            .filter(b => b.patientId && b.patientId.toString() === req.session.user.id)
            .map(b => {
                const doctorBookings = bookings.filter(db => db.doctorName === b.doctorName);
                const pos = doctorBookings.findIndex(db => db._id.toString() === b._id.toString()) + 1;
                return {
                    id:              b._id.toString(),
                    doctorName:      b.doctorName,
                    patientName:     b.patientName,
                    appointmentType: b.appointmentType,
                    appointmentTime: b.appointmentTime,
                    positionInLine:  pos
                };
            });

        res.render('pages/client-dashboard', { doctors, bookings, myBookings, user });
    } catch (err) {
        console.error('client getDashboard:', err);
        res.render('pages/client-dashboard', { doctors: [], bookings: [], myBookings: [], user: null });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const userId   = req.session.user.id;
        const user     = await User.findById(userId);
        const bookings = await Booking.find({ patientId: userId }).sort({ createdAt: 1 });

        const allBookings = await Booking.find().sort({ createdAt: 1 });
        const enrichedBookings = bookings.map(b => {
            const doctorBookings = allBookings.filter(db => db.doctorName === b.doctorName);
            const pos = doctorBookings.findIndex(db => db._id.toString() === b._id.toString()) + 1;
            return { ...b.toObject(), positionInLine: pos };
        });

        res.render('pages/profile', {
            user,
            appointments:  enrichedBookings,
            phoneSuccess:  req.query.phone === 'saved'
        });
    } catch (err) {
        console.error('client getProfile:', err);
        res.status(500).render('pages/error', { statusCode: 500, errorDetail: err.message });
    }
};

exports.updatePhone = async (req, res) => {
    try {
        const { phone } = req.body;
        const cleaned   = (phone || '').replace(/\s+/g, '').trim();

        // ── Backend Validation ──
        if (!cleaned)
            return res.redirect('/client/profile?error=Phone+number+is+required.');
        if (!/^\+?[0-9]{7,15}$/.test(cleaned))
            return res.redirect('/client/profile?error=Invalid+phone+format.+Use+7-15+digits,+optionally+starting+with+%2B.');

        await User.findByIdAndUpdate(req.session.user.id, { phone: cleaned });
        res.redirect('/client/profile?phone=saved');
    } catch (err) {
        res.redirect('/client/profile?error=' + encodeURIComponent(err.message));
    }
};

exports.uploadReport = async (req, res) => {
    try {
        if (!req.file) return res.redirect('/client/profile?error=No+file+was+uploaded.');

        // ── Backend Validation ──
        const allowedMime = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain',
                             'application/msword',
                             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const allowedExt  = ['.pdf', '.png', '.jpg', '.jpeg', '.txt', '.doc', '.docx'];
        const ext         = require('path').extname(req.file.originalname).toLowerCase();

        if (!allowedMime.includes(req.file.mimetype) && !allowedExt.includes(ext))
            return res.redirect('/client/profile?error=Invalid+file+type.+Only+PDF,+PNG,+JPG,+TXT,+and+DOC+files+are+allowed.');

        const maxSize = 5 * 1024 * 1024; // 5 MB
        if (req.file.size > maxSize)
            return res.redirect('/client/profile?error=File+size+must+not+exceed+5+MB.');

        const userId       = req.session.user.id;
        // In production (Cloudinary), req.file.path contains the full secure URL.
        // In development (Local), req.file.filename contains the local file name.
        const isProd = process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT === 'production';
        const fileRef = isProd ? req.file.path : req.file.filename;
        const originalName = req.file.originalname;

        await User.findByIdAndUpdate(userId, {
            $push: { medicalHistory: `${originalName}|${fileRef}` }
        });

        res.redirect('/client/profile?success=uploaded');
    } catch (err) {
        res.redirect('/client/profile?error=' + encodeURIComponent(err.message));
    }
};

exports.bookAppointment = async (req, res) => {
    try {
        const { doctorName, patientName, appointmentType } = req.body;
        const userId = req.session.user.id;

        // ── Backend Validation ──
        if (!doctorName || !patientName || !appointmentType)
            return res.json({ success: false, error: 'All fields are required.' });

        const trimmedName = String(patientName).trim();
        if (trimmedName.length < 2 || trimmedName.length > 60)
            return res.json({ success: false, error: 'Patient name must be between 2 and 60 characters.' });
        if (!/^[a-zA-Z\s\-'.]+$/.test(trimmedName))
            return res.json({ success: false, error: 'Patient name contains invalid characters.' });

        const validTypes = ['Consultation', 'Follow-up', 'Lab Result'];
        if (!validTypes.includes(appointmentType))
            return res.json({ success: false, error: 'Invalid appointment type.' });

        const doctor = await Doctor.findOne({ name: doctorName });
        if (!doctor) return res.json({ success: false, error: 'Doctor not found.' });

        const currentCount = await Booking.countDocuments({ doctorName });
        if (currentCount >= doctor.maxCapacity)
            return res.json({ success: false, error: 'This doctor is fully booked.' });

        const alreadyBooked = await Booking.findOne({ patientId: userId, doctorName });
        if (alreadyBooked)
            return res.json({ success: false, error: 'You already have an appointment with this doctor.' });

        const lastBooking = await Booking.findOne({ doctorName }).sort({ appointmentTime: -1 });
        let appointmentTime;

        if (lastBooking && lastBooking.appointmentTime > new Date()) {
            // Append to the end of the line by adding avgConsultationTime to the latest booking
            appointmentTime = new Date(lastBooking.appointmentTime.getTime() + doctor.avgConsultationTime * 60000);
        } else {
            // First booking of the day or all previous bookings are in the past
            appointmentTime = getAppointmentTime(doctor.timeSlot, doctor.avgConsultationTime, 0);
        }

        await Booking.create({ doctorName, patientName: trimmedName, patientId: userId, appointmentType, appointmentTime });
        res.json({ success: true });
    } catch (err) {
        // Catch MongoDB Duplicate Key Error (Race condition prevented by unique index)
        if (err.code === 11000) {
            return res.json({ 
                success: false, 
                error: 'This time slot was just taken by someone else. Please try booking again.' 
            });
        }
        res.json({ success: false, error: err.message });
    }
};

exports.cancelAppointment = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);
        if (!booking) return res.json({ success: false, error: 'Booking not found.' });

        const diffMins = (booking.appointmentTime - new Date()) / (1000 * 60);
        if (diffMins < 60)
            return res.json({ success: false, error: 'Cannot cancel within 1 hour of appointment.' });

        await Booking.findByIdAndDelete(bookingId);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};
