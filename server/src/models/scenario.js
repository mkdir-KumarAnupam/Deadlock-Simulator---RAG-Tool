module.exports = (sequelize, DataTypes) => {
  const Scenario = sequelize.define('Scenario', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false
    },
    thumbnail: {
      type: DataTypes.TEXT, // Base64 string
      allowNull: true
    }
  });
  return Scenario;
};
