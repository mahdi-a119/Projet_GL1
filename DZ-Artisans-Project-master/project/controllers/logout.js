const jwt = require("jsonwebtoken");

const logout = (req, res) => {
    
    res.cookie('userSave', '', {
        expires: new Date(0), 
        httpOnly: false,
        sameSite:'None',
         secure:true ,
         domain:"localhost"
    });
    
    
    res.status(200).json({ status: "success", message: "User logout successfully" });
}

module.exports = logout;
