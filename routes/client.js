const express = require('express');
const router = express.Router();
const { requireClient } = require('../middleware/auth');
const clientController = require('../controllers/clientController');
const multer = require('multer');
const path = require('path');

const localStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const cloudStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'hayat_hospital_uploads',
        resource_type: 'auto' 
    },
});

const isProduction = process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT === 'production';
const storage = isProduction ? cloudStorage : localStorage;

const upload = multer({ storage: storage });

router.get('/dashboard', requireClient, clientController.getDashboard);
router.post('/book', requireClient, clientController.bookAppointment);
router.post('/cancel', requireClient, clientController.cancelAppointment);
router.get('/profile', requireClient, clientController.getProfile);
router.post('/profile/update-phone', requireClient, clientController.updatePhone);
router.post('/profile/upload', requireClient, upload.single('reportFile'), clientController.uploadReport);

module.exports = router;