const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: false
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import Models
db.User = require('./user')(sequelize, Sequelize);
db.Scenario = require('./scenario')(sequelize, Sequelize);

// Associations
db.User.hasMany(db.Scenario, { foreignKey: 'userId' });
db.Scenario.belongsTo(db.User, { foreignKey: 'userId' });

module.exports = db;
