const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Institute = sequelize.define('Institute', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subdomain: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    custom_domain: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        allowNull: false,
        defaultValue: 'active'
    },
    subscription_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    subscription_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    domain: {
        type: DataTypes.STRING,
        allowNull: true
    },
    plan: {
        type: DataTypes.STRING,
        allowNull: true
    },
    expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'institutes',
    timestamps: false
});

module.exports = Institute;
