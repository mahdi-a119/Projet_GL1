const pool = require('../db/index');

// Function to copy data from utilisateurs to profilsartisans
const copyUserToArtisan = async (req, res) => {
    if (!req.user || !req.user.id) {

        console.log("unauthorized")
        return res.status(401).json({ status: "error", error: "Unauthorized" });
    }
    const { phoneNumber, selectedType, selectedWilaya, minCost, about } = req.body;
    if (!phoneNumber || !selectedType || !selectedWilaya || !minCost || !about) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const selectedTypeValue = selectedType.value;
    const selectedWilayaValue = selectedWilaya.value;
    
    // Log the values to confirm
    console.log(selectedTypeValue, selectedWilayaValue);

  try {
    // Fetch data from the utilisateurs table
    const userData = await pool.query(
      'SELECT nom, prenom, email, id ,photo_de_profil  FROM utilisateurs WHERE id = $1',
      [req.user.id]
    );
    const serviceResult = await pool.query(
      'SELECT id FROM services WHERE nom = $1',
      [selectedTypeValue]
    );
    console.log(serviceResult)
    const serviceId = serviceResult.rows[0].id
    console.log(serviceId , typeof(serviceId))
    if (userData.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Destructure the fetched data
    const { nom, prenom, email, id ,photo_de_profil } = userData.rows[0];



   
    await pool.query(
      `INSERT INTO profilsartisans (nom, prenom, email, id, photo_de_profil, phone_number, service_id, wilaya, prix,description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [nom, prenom, email, id, photo_de_profil, phoneNumber, serviceId, selectedWilayaValue, minCost, about]
    );
    await pool.query(
      'UPDATE utilisateurs SET type_utilisateur = $1 WHERE id = $2',
      ['artisan', id]
    );
    res.status(200).json({ message: 'Data copied successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while copying data' });
  }
};

module.exports = { copyUserToArtisan };