const Doctor  = require('../models/Doctor');
const Booking = require('../models/Booking');
const bcrypt  = require('bcryptjs');

function parseTimeMins(timeStr) {
    const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return null;
    let h       = parseInt(match[1], 10);
    const m     = parseInt(match[2], 10);
    const ampm  = match[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m;
}


function calculateCapacity(timeSlot, avgTime) {
    try {
        const parts      = timeSlot.split(' - ');
        const startStr   = parts[0].includes(', ')
            ? parts[0].substring(parts[0].lastIndexOf(', ') + 2)
            : parts[0];
        const endStr     = parts[1].trim();

        const startMins  = parseTimeMins(startStr);
        const endMins    = parseTimeMins(endStr);
        if (startMins === null || endMins === null || endMins <= startMins) return 1;

        return Math.max(1, Math.floor((endMins - startMins) / avgTime));
    } catch (e) {
        return 1;
    }
}

exports.getDashboard = async (req, res) => {
    try {
        const doctors  = await Doctor.find().sort({ name: 1 });
        const bookings = await Booking.find();
        res.render('pages/admin-dashboard', { doctors, bookings });
    } catch (err) {
        console.error('admin getDashboard:', err);
        res.render('pages/admin-dashboard', { doctors: [], bookings: [] });
    }
};

const VALID_SECTORS = ['Cardiology', 'Pediatrics', 'General', 'Orthopedics'];

function validateDoctorInput(name, sector, timeSlot, avg) {
    if (!name || !sector || !timeSlot || isNaN(avg))
        return 'All fields are required.';
    const trimmed = String(name).trim();
    if (trimmed.length < 3 || trimmed.length > 80)
        return 'Doctor name must be between 3 and 80 characters.';
    if (!/^[a-zA-Z\s\-'.]+$/.test(trimmed))
        return 'Doctor name contains invalid characters.';
    if (!VALID_SECTORS.includes(sector))
        return 'Invalid sector selected.';
    if (avg < 1 || avg > 120)
        return 'Consultation time must be between 1 and 120 minutes.';
    return null;
}

exports.addDoctor = async (req, res) => {
    try {
        const { name, password, sector, timeSlot, avgConsultationTime } = req.body;
        const avg = parseInt(avgConsultationTime, 10);

        // ── Backend Validation ──
        if (!password || password.trim().length < 4) return res.json({ success: false, error: 'Password must be at least 4 characters.' });
        const err = validateDoctorInput(name, sector, timeSlot, avg);
        if (err) return res.json({ success: false, error: err });

        const exists = await Doctor.findOne({ name: String(name).trim() });
        if (exists) return res.json({ success: false, error: 'A doctor with this name already exists.' });

        const maxCapacity = calculateCapacity(timeSlot, avg);
        const hashedPassword = await bcrypt.hash(password.trim(), 10);

        await Doctor.create({ name: String(name).trim(), password: hashedPassword, sector, timeSlot, avgConsultationTime: avg, maxCapacity });
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};

exports.editDoctor = async (req, res) => {
    try {
        const { originalName, name, password, sector, timeSlot, avgConsultationTime } = req.body;
        const avg = parseInt(avgConsultationTime, 10);

        // ── Backend Validation ──
        if (!originalName) return res.json({ success: false, error: 'Original doctor name is required.' });
        const err = validateDoctorInput(name, sector, timeSlot, avg);
        if (err) return res.json({ success: false, error: err });

        const maxCapacity = calculateCapacity(timeSlot, avg);
        
        const updateData = { name: String(name).trim(), sector, timeSlot, avgConsultationTime: avg, maxCapacity };
        
        if (password && password.trim().length >= 4) {
            updateData.password = await bcrypt.hash(password.trim(), 10);
        } else if (password && password.trim().length > 0) {
            return res.json({ success: false, error: 'Password must be at least 4 characters.' });
        }

        const updated = await Doctor.findOneAndUpdate(
            { name: originalName },
            updateData,
            { new: true }
        );
        if (!updated) return res.json({ success: false, error: 'Doctor not found.' });

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};

exports.deleteDoctor = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.json({ success: false, error: 'Doctor name is required.' });

        await Doctor.findOneAndDelete({ name });
        await Booking.deleteMany({ doctorName: name });

        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => res.redirect('/'));
};
