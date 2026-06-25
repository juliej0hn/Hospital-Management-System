const express = require('express');
const router  = express.Router();

// GET / — Landing page
router.get('/', (req, res) => res.render('pages/landing'));

module.exports = router;
