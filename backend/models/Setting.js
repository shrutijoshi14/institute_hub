const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Setting = sequelize.define('Setting', {
    key: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    value: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'settings',
    timestamps: false
});

module.exports = Setting;
