console.log('Server.js file is starting...');

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors'); 
const path = require('path');
require('dotenv').config();  



const authRoutes = require('./routes/authroutes');
const portfolioRoutes = require('./routes/portfolio');
const certificateRoutes = require('./routes/certificateroute')
const updateProfile = require('./routes/profile');
const servicesRoute = require('./routes/servicesroute');
const switchRoute = require('./routes/switchroute')
const Devis = require('./routes/devisRoute')
const app = express();

app.use(cors({
  origin: 'http://localhost:5173' , // Update with your frontend URL
  credentials: true
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true,
}));



app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/devis' , Devis)
app.use('/auth', authRoutes);
app.use('/portfolio', portfolioRoutes)
app.use('/certificate', certificateRoutes)
app.use('/profile',updateProfile ) 
app.use('/services',servicesRoute )   
app.use('/switch',switchRoute )

  const port = 4000;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    })
