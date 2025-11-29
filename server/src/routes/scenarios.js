const express = require('express');
const router = express.Router();
const scenarioController = require('../controllers/scenarioController');
const auth = require('../middleware/auth');

router.use(auth); // Protect all scenario routes

router.post('/', scenarioController.createScenario);
router.get('/', scenarioController.getScenarios);
router.get('/:id', scenarioController.getScenarioById);
router.delete('/:id', scenarioController.deleteScenario);

module.exports = router;
