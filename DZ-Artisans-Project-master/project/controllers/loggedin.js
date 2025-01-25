const jwt = require("jsonwebtoken");
const pool = require("../db/index");  
const { promisify } = require("util");

const loggedin = async (req, res, next) => {
  
  if (req.cookies.userSave) {
    try {
      
      const decoded = await promisify(jwt.verify)(req.cookies.userSave, process.env.JWT_SECRET);
      
      const result = await pool.query('SELECT * FROM utilisateurs WHERE id = $1', [decoded.id]);
      const user = result.rows[0];
      

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      
      req.user = user;
      req.user.type_utilisateur = decoded.type_utilisateur;


      next();

    } catch (err) {
      console.error(err);
      return res.status(401).json({ message: 'Unauthorized' });
    }
  } else {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

module.exports = loggedin;
