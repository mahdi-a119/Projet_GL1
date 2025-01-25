const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const randomstring = require('randomstring');
const dotenv = require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'waelamine896@gmail.com', 
    pass: 'kbsq chvh xtop wuhf' 
  },
});

const db = require('../db/index'); 

const sendOtp = (email,otp) => {
  
  

  const mailOptions = {
    from: 'waelamine896@gmail.com',
    to: email,
    subject: 'OTP Verification for Registration',
    text: `Your OTP is: ${otp}`,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject('Error sending OTP.');
      } else {
        resolve('OTP sent to your email.');
      }
    });
  });
};

const registerUser = async (req, res) => {
  const { nom, prenom, email, password } = req.body;

  if (!nom || !prenom || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

 

  try {
    const otp =  randomstring.generate({
      length: 6,
      charset: 'numeric'
    });
    const query = `
      INSERT INTO primuser (nom, prenom, email, password, otp, otp_created_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
      RETURNING *;
    `;

    const values = [nom, prenom, email, password, otp];

    
    const result = await pool.query(query, values);
    console.log('User inserted:', result.rows[0]);
    const message = await sendOtp(email ,otp);
    res.status(200).json({ message });
    console.log(message)
  } catch (error) {
    res.status(500).json({ message: error });
    console.log(error)
  }
};

const verifyOtpAndRegister = async (req, res) => {
  const { otp } = req.body;


  if (!otp) {
    return res.status(400).json({ message: 'OTP is required.' });
  }

  try {

    const selectQuery = `
      SELECT * FROM primuser 
      WHERE otp = $1 ;
    `;
    const result = await pool.query(selectQuery, [otp]);

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    const user = result.rows[0];


    const hashedPassword = await bcrypt.hash(user.password, 10);

  
    const insertQuery = `
      INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe)
      VALUES ($1, $2, $3, $4);
    `;
    const insertValues = [user.nom, user.prenom, user.email, hashedPassword];
    await pool.query(insertQuery, insertValues);

    
    const deleteQuery = `DELETE FROM primuser WHERE id = $1;`;
    await pool.query(deleteQuery, [user.id]);

    
    

    res.status(200).json({
      message: 'Registration successful.',
     
    });
  } catch (error) {
    console.error('Error verifying OTP and registering user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};


const resentOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {

    const selectQuery = `
      SELECT * FROM primuser 
      WHERE email = $1;
    `;
    const userResult = await pool.query(selectQuery, [email]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found or already verified.' });
    }

    const user = userResult.rows[0];

    
    const newOtp = randomstring.generate({
      length: 5,
      charset: 'numeric',
    });

    
    const updateQuery = `
      UPDATE primuser
      SET otp = $1, otp_created_at = CURRENT_TIMESTAMP
      WHERE email = $2;
    `;
    await pool.query(updateQuery, [newOtp, email]);

  
    const message = await sendOtp(email, newOtp);

    res.status(200).json({ message });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: "error", error: "Please provide email and password" });
  }

  try {
    // Fetch user from the database
    const query = 'SELECT * FROM utilisateurs WHERE email = $1';
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ status: "error", error: "Incorrect email or password" });
    }

    const user = result.rows[0];

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.mot_de_passe);
    if (!isPasswordValid) {
      return res.status(401).json({ status: "error", error: "Incorrect email or password" });
    }

    // Check if the user is verified (if applicable)
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES }
    );

    // Set cookie options
    const cookieOptions = {
      expires: new Date(Date.now() + parseInt(process.env.JWT_COOKIE_EXPIRES, 10) * 60 * 60 * 1000), // Correct expiration calculation
      httpOnly: false,
      sameSite: 'None',
      secure: true,
    };

    // Send response with cookie
    return res.status(200)
      .cookie("userSave", token, cookieOptions)
      .json({
        status: "success",
        message: "User logged in successfully",
        user: {
          id: user.id,
          role: user.type_utilisateur,
        },
      });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ status: "error", error: "Internal server error" });
  }
};


const getUser = async (req , res)=>{
  if (!req.user || !req.user.id) {
    console.log("Unauthorized");
    return res.status(401).json({ status: "error", error: "Unauthorized" });
}
  try{
    const query = 'SELECT * FROM utilisateurs WHERE id = $1';
    const result = await pool.query(query, [req.user.id]);
  
    return res.status(200).json(result.rows[0]);
  } catch (err) {
      console.error(err);
      return res.status(500).json({ status: "error", error: "Error fetching all certificates" });
  }


}
module.exports = {
  registerUser,
  verifyOtpAndRegister,
  login,
  resentOtp,
  getUser
};