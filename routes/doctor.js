

const express          = require('express');
const router           = express.Router();
const doctorController = require('../controllers/doctorController');

router.get('/login',        doctorController.getLogin);
router.post('/login',       doctorController.postLogin);
router.get('/dashboard',    doctorController.getDashboard);
router.post('/update-slots', doctorController.updateSlots);
router.post('/clear-slot',  doctorController.clearSlot);   
router.get('/logout',       doctorController.logout);

module.exports = router;