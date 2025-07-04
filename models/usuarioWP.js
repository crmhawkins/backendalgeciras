'use strict';

const { DataTypes } = require('sequelize');
const { wpDb } = require('../database/config');  // Assuming wpDb is the connection for WordPress DB

const WordpressUser = wpDb.define('wp_users', {
  ID: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  user_login: {
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true,
  },
  user_pass: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  user_nicename: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  user_email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  user_url: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  user_registered: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  user_activation_key: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  user_status: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  display_name: {
    type: DataTypes.STRING(250),
    allowNull: false,
  }
}, {
  tableName: 'wp_users',
  timestamps: false,  // WordPress does not have created_at or updated_at columns by default
});

module.exports = WordpressUser;
