const pool = require('../db/index');

const uploadPhotos = async (req, res) => {
  if (!req.user || !req.user.id) {
    console.log("Unauthorized");
    return res.status(401).json({ status: "error", error: "Unauthorized" });
}
  const {projectName, description} = req.body
  const file = req.file;
  console.log(file.filename)
  try {
    
    imagePath= `${req.protocol}://${req.get('host')}/uploads/${file.filename }`
      const projectResult = await pool.query(
        `INSERT INTO Portfolio (ArtisanID, ProjectName, Description, ImageURL)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [req.user.id, projectName, description, imagePath]
    );
    
    res.status(200).json({ message: 'Project uploaded successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while uploading photos' });
  }
};
const getProjectById = async (req, res) => {
  const { projectId } = req.params;

  if (!req.user || !req.user.id) {
      console.log("Unauthorized");
      return res.status(401).json({ status: "error", error: "Unauthorized" });
  }

  try {
      // Step 1: Get the project by ID and ArtisanID
      const projectResult = await pool.query(
          `SELECT * FROM Portfolio WHERE ProjectID = $1 AND ArtisanID = $2`,
          [projectId, req.user.id]
      );

      if (projectResult.rows.length === 0) {
          return res.status(404).json({ status: "error", error: "Project not found" });
      }

      // Step 2: Return the project details
      return res.status(200).json(projectResult.rows[0]);
  } catch (err) {
      console.error(err);
      return res.status(500).json({ status: "error", error: "Error fetching project by ID" });
  }
};
const getAllProjects = async (req, res) => {
  if (!req.user || !req.user.id) {
      console.log("Unauthorized");
      return res.status(401).json({ status: "error", error: "Unauthorized" });
  }

  try {
      // Step 1: Get all projects for the artisan
      const projectsResult = await pool.query(
          `SELECT * FROM Portfolio WHERE ArtisanID = $1`,
          [req.user.id]
      );

      // Step 2: Return the list of projects
      return res.status(200).json(projectsResult.rows);
  } catch (err) {
      console.error(err);
      return res.status(500).json({ status: "error", error: "Error fetching all projects" });
  }
};

module.exports = { uploadPhotos ,getAllProjects ,getProjectById };