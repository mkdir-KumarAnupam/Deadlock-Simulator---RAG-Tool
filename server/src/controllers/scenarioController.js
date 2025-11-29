const { Scenario } = require('../models');

exports.createScenario = async (req, res) => {
  try {
    const { name, data, thumbnail } = req.body;
    const scenario = await Scenario.create({
      userId: req.user.userId,
      name,
      data,
      thumbnail
    });
    res.status(201).json(scenario);
  } catch (error) {
    res.status(500).json({ message: 'Error creating scenario', error: error.message });
  }
};

exports.getScenarios = async (req, res) => {
  try {
    const scenarios = await Scenario.findAll({ where: { userId: req.user.userId } });
    res.json(scenarios);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching scenarios', error: error.message });
  }
};

exports.getScenarioById = async (req, res) => {
  try {
    const scenario = await Scenario.findOne({
      where: { id: req.params.id, userId: req.user.userId }
    });
    if (!scenario) return res.status(404).json({ message: 'Scenario not found' });
    res.json(scenario);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching scenario', error: error.message });
  }
};

exports.deleteScenario = async (req, res) => {
  try {
    const result = await Scenario.destroy({
      where: { id: req.params.id, userId: req.user.userId }
    });
    if (!result) return res.status(404).json({ message: 'Scenario not found' });
    res.json({ message: 'Scenario deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting scenario', error: error.message });
  }
};
