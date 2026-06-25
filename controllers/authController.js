
const bcrypt = require('bcryptjs');
const User   = require('../models/User');


exports.getLogin = (req, res) => {
    if (req.session.user) return res.redirect('/client/dashboard');
    res.render('pages/auth');
};


exports.postLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.redirect('/auth?error=missing');

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.redirect('/auth?error=invalid');

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.redirect('/auth?error=invalid');

        req.session.user = {
            id:        user._id.toString(),
            firstName: user.firstName,
            lastName:  user.lastName,
            email:     user.email,
            role:      'client'
        };

        return res.redirect('/client/dashboard');
    } catch (err) {
        console.error('postLogin error:', err);
        res.redirect('/auth?error=server');
    }
};


exports.postSignup = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        // ── Backend Validation ──
        if (!firstName || !lastName || !email || !password)
            return res.redirect('/auth?error=missing');

        const trimFirst = String(firstName).trim();
        const trimLast  = String(lastName).trim();
        if (trimFirst.length < 2 || trimFirst.length > 50 || trimLast.length < 2 || trimLast.length > 50)
            return res.redirect('/auth?error=missing');

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email))
            return res.redirect('/auth?error=invalid');

        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        if (!passwordRegex.test(password))
            return res.redirect('/auth?error=weakpass');

        if (phone) {
            const cleanPhone = phone.replace(/\s+/g, '').trim();
            if (cleanPhone && !/^\+?[0-9]{7,15}$/.test(cleanPhone))
                return res.redirect('/auth?error=invalidphone');
        }

        const exists = await User.findOne({ email: email.toLowerCase().trim() });
        if (exists) return res.redirect('/auth?error=exists');

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            firstName: trimFirst,
            lastName:  trimLast,
            email:    email.toLowerCase().trim(),
            password: hashed,
            phone:    phone ? phone.replace(/\s+/g, '').trim() : '',
            role:     'client'
        });

        req.session.user = {
            id:        user._id.toString(),
            firstName: user.firstName,
            lastName:  user.lastName,
            email:     user.email,
            role:      'client'
        };

        return res.redirect('/client/dashboard');
    } catch (err) {
        console.error('postSignup error:', err);
        res.redirect('/auth?error=server');
    }
};


exports.logout = (req, res) => {
    req.session.destroy(() => res.redirect('/auth'));
};
