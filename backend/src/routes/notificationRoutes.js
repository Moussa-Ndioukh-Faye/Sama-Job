/**
 * Routes Notifications
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifierToken } = require('../middleware/auth');

router.use(verifierToken);

// Récupérer mes notifications
router.get('/', notificationController.obtenirNotifications);

// Compter les non lues
router.get('/non-lues/count', notificationController.compterNonLues);

// Marquer une notification comme lue
router.put('/:notificationId/lue', notificationController.marquerCommeLue);

// Marquer toutes comme lues
router.put('/lues', notificationController.marquerToutesLues);

module.exports = router;
