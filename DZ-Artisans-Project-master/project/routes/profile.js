const express = require('express');
const router = express.Router();
const upload = require('../controllers/uploader');
const {getProfil, submitForm , updateProfilePicture } = require('../controllers/updateProfile');
const loggedin = require('../controllers/loggedin')
// POST /submit-form
router.post('/updateProfile',loggedin,upload.single('photo'), submitForm);
router.post('/updateProfilePicture',loggedin, updateProfilePicture);
router.get("/getartisan" , loggedin ,getProfil)
module.exports = router;