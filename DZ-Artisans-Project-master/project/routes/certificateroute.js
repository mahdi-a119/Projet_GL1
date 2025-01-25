const express = require('express');
const router = express.Router();
const upload = require('../controllers/uploader');
const  { uploadcertificates ,getAllCertificates , getCertificateById}= require('../controllers/certificates');
const loggedin = require('../controllers/loggedin')

router.post('/addcertificate', loggedin, upload.single('file'), uploadcertificates);
router.get('/', loggedin, getAllCertificates);
router.get('/getById/:certificateId', loggedin, getCertificateById);

module.exports = router;