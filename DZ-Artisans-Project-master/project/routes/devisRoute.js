const express = require('express');
const router = express.Router();
const devisController = require('../controllers/devis');
const loggedin = require('../controllers/loggedin')
// Send a devis
router.post('/send_devis',loggedin, devisController.sendDevis);

// Get devis for an artisan
router.get('/get_devis_for_artisan',loggedin, devisController.getDevisForArtisan);

// Artisan proposes a devis
router.post('/propose_devis',loggedin, devisController.proposeDevis);

// Client accepts a response
router.post('/client_accept_response/:respons_id',loggedin, devisController.clientAcceptResponse);

// Get projects an artisan is working on
router.get('/get_artisan_projects',loggedin, devisController.getArtisanProjects);

// Get responses for a specific devis
router.get('/get_responses_for_devis/:devis_id',loggedin, devisController.getResponsesForDevis);

// Mark a devis as viewed
router.post('/mark_devis_as_viewed/:devis_id',loggedin, devisController.markDevisAsViewed);

// Mark a devis as deleted
router.post('/mark_devis_as_deleted/:devis_id',loggedin, devisController.markDevisAsDeleted);

// Get devis by ID
router.get('/get_devis_by_id/:devis_id',loggedin, devisController.getDevisById);

// Get devis proposals by ID
router.get('/get_devis_proposals_by_id/:devis_id',loggedin, devisController.getDevisProposalsById);

// Get pending notifications
router.get('/get_pending_notifications',loggedin, devisController.getPendingNotifications);

// Mark pending devis as viewed
router.post('/mark_pending_as_viewed', loggedin,devisController.markPendingAsViewed);



router.get('/get_devis_by_user_id', loggedin, devisController.getDevisByUserId);
module.exports = router;