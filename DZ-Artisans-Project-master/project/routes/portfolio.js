const express = require('express');
const router = express.Router();
const upload = require('../controllers/uploader');
const { uploadPhotos ,getAllProjects ,getProjectById } = require('../controllers/portfolioController');
const loggedin = require('../controllers/loggedin')

router.post('/addProject', loggedin, upload.single('image'), uploadPhotos);
router.get('/', loggedin, getAllProjects);
router.get('/getById/:projectId', loggedin, getProjectById);
module.exports = router;