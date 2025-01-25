const express = require('express');
const router = express.Router();
const {getServices , getArtisansByServiceId , searchServices } = require('../controllers/services');


router.get('/service/:service_id', getArtisansByServiceId);
router.get('/search', searchServices);
router.get('/get', getServices);
module.exports = router;