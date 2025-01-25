const pool = require('../db/index');

const uploadcertificates = async (req, res) => {
    if (!req.user || !req.user.id) {
      console.log("Unauthorized");
      return res.status(401).json({ status: "error", error: "Unauthorized" });
  }
    const {certificateName, description} = req.body
    const file = req.file;
    console.log(file.filename)
    try {
      
      filePath= `${req.protocol}://${req.get('host')}/uploads/${file.filename }`
        const projectResult = await pool.query(
          `INSERT INTO certificates (ArtisanID, certificatename, Description, FilePath)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [req.user.id, certificateName, description, filePath]
      );
      
      res.status(200).json({ message: 'certificate uploaded successfully' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while uploading photos' });
    }
  };
  const getCertificateById = async (req, res) => {
    const { certificateId } = req.params;

    if (!req.user || !req.user.id) {
        console.log("Unauthorized");
        return res.status(401).json({ status: "error", error: "Unauthorized" });
    }

    try {
        // Step 1: Get the certificate by ID and ArtisanID
        const certificateResult = await pool.query(
            `SELECT * FROM Certificates WHERE CertificateID = $1 AND ArtisanID = $2`,
            [certificateId, req.user.id]
        );

        if (certificateResult.rows.length === 0) {
            return res.status(404).json({ status: "error", error: "Certificate not found" });
        }

        // Step 2: Return the certificate details
        return res.status(200).json(certificateResult.rows[0]);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", error: "Error fetching certificate by ID" });
    }
};
const getAllCertificates = async (req, res) => {
    if (!req.user || !req.user.id) {
        console.log("Unauthorized");
        return res.status(401).json({ status: "error", error: "Unauthorized" });
    }

    try {
        // Step 1: Get all certificates for the artisan
        const certificatesResult = await pool.query(
            `SELECT * FROM Certificates WHERE ArtisanID = $1`,
            [req.user.id]
        );

        // Step 2: Return the list of certificates
        return res.status(200).json(certificatesResult.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", error: "Error fetching all certificates" });
    }
};
  
  module.exports = { uploadcertificates ,getAllCertificates , getCertificateById};