const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Setting = sequelize.define('Setting', {
    key: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    tenant_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
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
