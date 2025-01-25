const express = require('express');
const { registerUser, verifyOtpAndRegister , login  , resentOtp , getUser} = require('../controllers/authController');
const logout = require("../controllers/logout")
const app = express();
const router = express.Router();
const loggedin = require('../controllers/loggedin')
router.post('/register', registerUser);
router.post('/verify-otp', verifyOtpAndRegister);
router.post('/login',login)
router.post("/resentOtp" ,resentOtp)
router.get("/user" ,loggedin , getUser)
router.post("/logout" ,logout)

module.exports = router;