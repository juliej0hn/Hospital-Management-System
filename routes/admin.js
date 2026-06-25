const express          = require('express');
const router           = express.Router();
const { requireAdmin } = require('../middleware/auth');
const adminController  = require('../controllers/adminController');

// GET /admin/login — show login form
router.get('/login', (req, res) => res.render('pages/admin-login', { error: null }));

// POST /admin/login — check credentials from .env
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === adminUser && password === adminPass) {
        req.session.isAdmin = true;
        return res.redirect('/admin/dashboard');
    } 
    res.render('pages/admin-login', { error: 'Invalid username or password.' });
});

router.get('/dashboard', requireAdmin, adminController.getDashboard);
router.post('/doctor',      requireAdmin, adminController.addDoctor);
router.post('/doctor/edit', requireAdmin, adminController.editDoctor);
router.post('/doctor/delete', requireAdmin, adminController.deleteDoctor);
router.get('/logout', adminController.logout);

module.exports = router;