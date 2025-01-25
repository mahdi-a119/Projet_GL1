const { Pool } = require('pg');
const pool = require('../db/index');

// Function to send a devis
const sendDevis = async (req, res) => {
  const { selectedWilaya, selectedType, phoneNumber, maxCost, deadline, projectName , projectDescription} = req.body;

  if (!req.user || !req.user.id) {
      console.log("Unauthorized");
      return res.status(401).json({ status: "error", error: "Unauthorized" });
  }

  try {
      // Step 1: Get the ServiceID based on the service name (TypeService)
      const serviceResult = await pool.query(
          `SELECT id FROM services WHERE nom = $1`,
          [selectedType]
      );

      if (serviceResult.rows.length === 0) {
          return res.status(404).json({ status: "error", error: "Service not found" });
      }

      const service_id = serviceResult.rows[0].id;

      // Step 2: Insert the devis into the DemandeDevis table
      const devisResult = await pool.query(
          `INSERT INTO DemandeDevis (ClientID, Adresse, Telephone, CoutMax, ServiceID, typeservice, DateLimite, NomProjet , description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8 ,$9)
           RETURNING *`,
          [req.user.id, selectedWilaya,phoneNumber, maxCost, service_id,selectedType,  deadline, projectName , projectDescription]
      );

      const devis_id = devisResult.rows[0].devisid;

      // Step 3: Get all artisans with the same ServiceID
      const artisansResult = await pool.query(
          `SELECT id FROM profilsartisans WHERE service_id = $1`,
          [service_id]
      );

      // Step 4: Insert entries into ArtisanDevisStatus for each artisan
      for (const artisan of artisansResult.rows) {
          await pool.query(
              `INSERT INTO ArtisanDevisStatus (ArtisanID, DevisID, Status)
               VALUES ($1, $2, 'Pending')`,
              [artisan.id, devis_id]
          );
      }

      return res.status(200).json(devisResult.rows[0]);
  } catch (err) {
      console.error(err);
      return res.status(500).json({ status: "error", error: "Error sending devis" });
  }
};

// Function to get devis for an artisan
const getDevisForArtisan = async (req, res) => {
    if (!req.user || !req.user.id) {
        console.log("Unauthorized");
        return res.status(401).json({ status: "error", error: "Unauthorized" });
    }

    try {
        // Step 1: Get the ServiceID from the ProfilsArtisans table based on the ArtisanID
        const artisanResult = await pool.query(
            `SELECT service_id , wilaya FROM profilsartisans WHERE id = $1`,
            [req.user.id]
        );

        if (artisanResult.rows.length === 0) {
            return res.status(404).json({ status: "error", error: "Artisan not found" });
        }

        const service_id = artisanResult.rows[0].service_id;
        const wilaya =artisanResult.rows[0].wilaya
        // Step 2: Get all devis that match the ServiceID and have not been viewed or deleted by the specific artisan
        const devisResult = await pool.query(`
            SELECT 
                d.*, 
                u.nom , 
                u.prenom , 
                u.photo_de_profil 
            FROM 
                DemandeDevis d
            LEFT JOIN 
                ArtisanDevisStatus ads ON d.DevisID = ads.DevisID AND ads.ArtisanID = $1
            LEFT JOIN 
                utilisateurs u ON d.clientID = u.id
            WHERE 
                d.ServiceID = $2 
                AND d.Adresse = $3 
                AND (ads.Status = 'Pending' OR ads.Status = 'Viewed')
        `, [req.user.id, service_id, wilaya]);
        console.log("devis de l'artisan",devisResult.rows)

        return res.status(200).json(devisResult.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", error: "Error fetching devis for artisan" });
    }
};

// Function for artisan to propose a devis
const proposeDevis = async (req, res) => {
    const { devis_id, temps_estime, prix_propose } = req.body;

    if (!req.user || !req.user.id) {
        console.log("Unauthorized");
        return res.status(401).json({ status: "error", error: "Unauthorized" });
    }

    try {
        await pool.query(`
            INSERT INTO ArtisanResponse (DevisID, ArtisanID, TempsEstime, PrixPropose)
            VALUES ($1, $2, $3, $4)
        `, [devis_id, req.user.id, temps_estime, prix_propose]);

        return res.status(200).json({ message: 'Devis proposed successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", error: "Error proposing devis" });
    }
};

// Function for client to accept a response
const clientAcceptResponse = async (req, res) => {
    const { response_id } = req.params;
  
    if (!req.user || !req.user.id) {
        console.log("Unauthorized");
        return res.status(401).json({ status: "error", error: "Unauthorized" });
    }
  
    try {
        // Step 1: Get the DevisID from the ArtisanResponse table
        const responseResult = await pool.query(
            `SELECT DevisID FROM ArtisanResponse WHERE ResponseID = $1`,
            [response_id]
        );
  
        if (responseResult.rows.length === 0) {
            return res.status(404).json({ status: "error", error: "Response not found" });
        }
  
        const devis_id = responseResult.rows[0].devisid;
  
        // Step 2: Update the status of the response to 'Accepted' in ArtisanResponse
        await pool.query(
            `UPDATE ArtisanResponse SET Status = 'Accepted' WHERE ResponseID = $1`,
            [response_id]
        );
  
        // Step 3: Update the status of the devis to 'Accepted' in ArtisanDevisStatus for the specific artisan
        await pool.query(
            `UPDATE ArtisanDevisStatus SET Status = 'Accepted' WHERE DevisID = $1 AND ArtisanID = (
                SELECT ArtisanID FROM ArtisanResponse WHERE ResponseID = $2
            )`,
            [devis_id, response_id]
        );
  
        // Step 4: Delete all other proposals for the same DevisID
        await pool.query(
            `DELETE FROM ArtisanResponse WHERE DevisID = $1 AND ResponseID != $2`,
            [devis_id, response_id]
        );
  
        return res.status(200).json({ message: 'Response accepted and other proposals deleted' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", error: "Error accepting response" });
    }
  };

// Function to get projects an artisan is working on
const getArtisanProjects = async (req, res) => {
    if (!req.user || !req.user.id) {
        console.log("Unauthorized");
        return res.status(401).json({ status: "error", error: "Unauthorized" });
    }

    try {
        // Get all devis where the artisan's response has been accepted
        const projectsResult = await pool.query(`
            SELECT d.* FROM DemandeDevis d
            JOIN ArtisanResponse ar ON d.DevisID = ar.DevisID
            WHERE ar.ArtisanID = $1 AND ar.Status = 'Accepted'
        `, [req.user.id]);

        return res.status(200).json(projectsResult.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", error: "Error fetching artisan projects" });
    }
};

// Function to get responses for a specific devis
const getResponsesForDevis = async (req, res) => {
    const { devis_id } = req.params;

    try {
        const result = await pool.query(`
            SELECT * FROM ArtisanResponse WHERE DevisID = $1
        `, [devis_id]);

        return res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", error: "Error fetching responses for devis" });
    }
};

// Function to mark a devis as viewed
const markDevisAsViewed = async (req, res) => {
    const { devis_id } = req.params;

    if (!req.user || !req.user.id) {
        console.log("Unauthorized");
        return res.status(401).json({ status: "error", error: "Unauthorized" });
    }

    try {
        // Insert or update the status to 'Viewed' for the specific artisan
        await pool.query(`
            INSERT INTO ArtisanDevisStatus (ArtisanID, DevisID, Status)
            VALUES ($1, $2, 'Viewed')
            ON CONFLICT (ArtisanID, DevisID) DO UPDATE SET Status = 'Viewed'
        `, [req.user.id, devis_id]);

        return res.status(200).json({ message: 'Devis marked as viewed' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", error: "Error marking devis as viewed" });
    }
};

// Function to mark a devis as deleted
const markDevisAsDeleted = async (req, res) => {
  const { devis_id } = req.params;

  if (!req.user || !req.user.id) {
      console.log("Unauthorized");
      return res.status(401).json({ status: "error", error: "Unauthorized" });
  }

  try {
      // Delete the entry from the ArtisanDevisStatus table for the specific artisan and devis
      await pool.query(
          `DELETE FROM ArtisanDevisStatus WHERE ArtisanID = $1 AND DevisID = $2`,
          [req.user.id, devis_id]
      );

      return res.status(200).json({ message: 'Devis deleted from status table' });
  } catch (err) {
      console.error(err);
      return res.status(500).json({ status: "error", error: "Error deleting devis from status table" });
  }
};

// Function to get devis by ID
const getDevisById = async (req, res) => {
  const { devis_id } = req.params;

  if (!req.user || !req.user.id) {
      console.log("Unauthorized");
      return res.status(401).json({ status: "error", error: "Unauthorized" });
  }

  try {
      // Step 1: Get the devis by ID
      const devisResult = await pool.query(
          `SELECT * FROM DemandeDevis WHERE DevisID = $1`,
          [devis_id]
      );

      if (devisResult.rows.length === 0) {
          return res.status(404).json({ status: "error", error: "Devis not found" });
      }

      // Step 2: Return the devis details
      return res.status(200).json(devisResult.rows[0]);
  } catch (err) {
      console.error(err);
      return res.status(500).json({ status: "error", error: "Error fetching devis by ID" });
  }
};

// Function to get devis proposals by ID
const getDevisProposalsById = async (req, res) => {
  const { devis_id } = req.params;

  if (!req.user || !req.user.id) {
      console.log("Unauthorized");
      return res.status(401).json({ status: "error", error: "Unauthorized" });
  }

  try {
      // Step 1: Get all proposals (responses) for the specified DevisID
      const proposalsResult = await pool.query(
          `SELECT * FROM ArtisanResponse WHERE DevisID = $1`,
          [devis_id]
      );

      // Step 2: Return the proposals
      return res.status(200).json(proposalsResult.rows);
  } catch (err) {
      console.error(err);
      return res.status(500).json({ status: "error", error: "Error fetching devis proposals by ID" });
  }
};

// Function to get pending notifications
const getPendingNotifications = async (req, res) => {
    if (!req.user || !req.user.id) {
        console.log("Unauthorized");
        return res.status(401).json({ status: "error", error: "Unauthorized" });
    }

    try {
        // Get all devis with 'Pending' status for the artisan
        const notificationsResult = await pool.query(
            `SELECT d.* FROM DemandeDevis d
             JOIN ArtisanDevisStatus ads ON d.DevisID = ads.DevisID
             WHERE ads.ArtisanID = $1 AND ads.Status = 'Pending'`,
            [req.user.id]
        );

        return res.status(200).json(notificationsResult.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", error: "Error fetching pending notifications" });
    }
};

// Function to mark pending devis as viewed
const markPendingAsViewed = async (req, res) => {
    if (!req.user || !req.user.id) {
        console.log("Unauthorized");
        return res.status(401).json({ status: "error", error: "Unauthorized" });
    }

    try {
        // Update the status of all 'Pending' devis to 'Viewed' for the artisan
        await pool.query(
            `UPDATE ArtisanDevisStatus SET Status = 'Viewed'
             WHERE ArtisanID = $1 AND Status = 'Pending'`,
            [req.user.id]
        );

        return res.status(200).json({ message: 'All pending devis marked as viewed' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", error: "Error marking pending devis as viewed" });
    }
};
const getDevisByUserId = async (req, res) => {
    if (!req.user || !req.user.id) {
        console.log("Unauthorized");
        return res.status(401).json({ status: "error", error: "Unauthorized" });
    }

    try {
        // Step 1: Get all devis for the authenticated user (client)
        const devisResult = await pool.query(
            `SELECT * FROM DemandeDevis WHERE ClientID = $1`,
            [req.user.id]
        );

        // Step 2: Return the list of devis
        return res.status(200).json(devisResult.rows);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: "error", error: "Error fetching devis by user ID" });
    }
};


module.exports = {
    sendDevis,
    getDevisForArtisan,
    proposeDevis,
    clientAcceptResponse,
    getArtisanProjects,
    getResponsesForDevis,
    markDevisAsViewed,
    markDevisAsDeleted,
    getDevisById,
    getDevisProposalsById,
    getPendingNotifications,
    markPendingAsViewed,
    getDevisByUserId
};