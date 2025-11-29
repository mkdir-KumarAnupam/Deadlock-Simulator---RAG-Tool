try {
  console.log('Requiring models...');
  const db = require('./models');
  console.log('Models required successfully');
  console.log('Sequelize instance:', db.sequelize ? 'Found' : 'Missing');
} catch (error) {
  console.error('Error requiring models:', error);
}
