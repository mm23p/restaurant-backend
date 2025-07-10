const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    full_name: { type: DataTypes.STRING, allowNull: true },
    role: { type: DataTypes.ENUM('admin', 'manager', 'waiter'), allowNull: false },
    last_known_token: {
  type: DataTypes.TEXT,
  allowNull: true
},
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    tableName: 'users',
    timestamps: true
  });

  User.associate = (models) => {
    User.hasMany(models.ChangeRequest, { foreignKey: 'requesterId', as: 'requesterRequests' });
    User.hasMany(models.ChangeRequest, { foreignKey: 'approverId', as: 'approverRequests' });
  };

  return User;
};