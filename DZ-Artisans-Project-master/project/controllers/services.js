const pool = require('../db/index');

// Function to get artisans by service_id
const getArtisansByServiceId = async (req, res) => {
  const { service_id } = req.params; // Get service_id from the URL parameters

  try {
    // Query to fetch artisans based on service_id
    const result = await pool.query(
      'SELECT * FROM services WHERE id = $1',
      [service_id]
    );

    // Return the results
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching artisans' });
  }
};
const searchServices = async (req, res) => {
    const { query } = req.query; // Get search query from the URL query parameters
  
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    console.log(`Searching for: ${query}`)
    try {
      // Query to search services based on name or description
      const result = await pool.query(
        `SELECT * 
         FROM services 
         WHERE nom ILIKE $1 OR description ILIKE $1`,
        [`%${query}%`] // Use % for partial matching
      );
  
      // Return the results
      res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while searching services' });
    }
  };

  const getServices = async (req, res) => {
 
  
    try {

      const result = await pool.query(
        'SELECT * FROM services',
       
      );
  
     console.log(result.rows)
      res.status(200).json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred while fetching artisans' });
    }
  };

module.exports = {getServices, getArtisansByServiceId ,searchServices };