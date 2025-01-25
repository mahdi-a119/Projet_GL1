const pool = require('../db/index');


const submitForm = async (req, res) => {
    if (!req.user || !req.user.id) {

        console.log("unauthorized")
        return res.status(401).json({ status: "error", error: "Unauthorized" });
    }
    console.log(req.body)
  const {
    nom,
    prenom,
    email,
    phonenumber,
    wilaya,
    cout_minimale,
    service,
    description,
  } = req.body;
  const file = req.file 
  const profilePicturePath = `${req.protocol}://${req.get('host')}/uploads/${file.filename }`
  const query = 'UPDATE profilsartisans SET photo_de_profil = ? WHERE id = ?';
  const query2 = 'UPDATE utilisateurs SET photo_de_profil = ? WHERE id = ?';
  if (req.user.type_utilisateur == "artisan"){
    await db.query(query, [profilePicturePath, req.user.id]);
    await db.query(query2, [profilePicturePath, req.user.id])
  }else{
    await db.query(query2, [profilePicturePath, req.user.id])
  }
  try {
  
    await pool.query(
        `UPDATE profilsartisans
         SET nom = $1, prenom = $2, email = $3, phone_number = $4, wilaya = $5, prix = $6, service_id = (SELECT id FROM services WHERE nom = $7), description = $8
         WHERE id = $9`,
        [nom, prenom, email, phonenumber, wilaya, cout_minimale, service, description, req.user.id]
      );

    res.status(200).json({ message: 'Form submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while submitting the form' });
  }
};

const updateProfilePicture= async (req , res)=>{
try{
  if (!req.user || !req.user.id) {

    console.log("unauthorized")
    return res.status(401).json({ status: "error", error: "Unauthorized" });
}

  const file = req.file 
  const profilePicturePath = `${req.protocol}://${req.get('host')}/uploads/${file.filename }`
  const query = 'UPDATE profilsartisans SET photo_de_profil = ? WHERE id = ?';
  const query2 = 'UPDATE utilisateurs SET photo_de_profil = ? WHERE id = ?';

  if (req.user.type_utilisateur == "artisan"){
    await db.query(query, [profilePicturePath, req.user.id]);
    await db.query(query2, [profilePicturePath, req.user.id])
  }else{
    await db.query(query2, [profilePicturePath, req.user.id])
  }
  res.status(200).json({ message: 'Profile picture updated successfully', profilePicturePath });
}catch(err){
  console.error('Error updating profile picture:', error);
        res.status(500).json({ message: 'Failed to update profile picture' });
}
}
const getProfil = async (req , res)=>{
  if (!req.user || !req.user.id) {
    console.log("Unauthorized");
    return res.status(401).json({ status: "error", error: "Unauthorized" });
}
  try{
    const query = `
      SELECT p.nom AS name, 
             p.prenom AS fname ,
             s.nom AS service, 
             p.email, 
             p.wilaya as location, 
             p.phone_number AS phone, 
             p.photo_de_profil AS photo, 
             p.prix AS coutMin, 
             p.description
      FROM profilsartisans p
      JOIN services s ON p.service_id = s.id
      WHERE p.id = $1
    `;
    
    const result = await pool.query(query, [req.user.id]);
    console.log(result)
    console.log(result.rows)
    return res.status(200).json(result.rows[0]);
  } catch (err) {
      console.error(err);
      return res.status(500).json({ status: "error", error: "Error fetching all certificates" });
  }


}




module.exports = {getProfil, submitForm , updateProfilePicture };