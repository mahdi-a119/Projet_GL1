const express = require('express');
const router = express.Router();
const { copyUserToArtisan } = require('../controllers/switch');
const loggedin = require('../controllers/loggedin')
// POST /copy-user/:utilisateur_id
router.post('/',loggedin, copyUserToArtisan);

module.exports = router;