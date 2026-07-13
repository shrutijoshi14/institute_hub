const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Subscription = sequelize.define('Subscription', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    billing_cycle: {
        type: DataTypes.ENUM('monthly', 'yearly'),
        allowNull: false,
        defaultValue: 'monthly'
    },
    max_users: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: -1
    },
    max_students: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: -1
    },
    max_parents: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: -1
    },
    max_faculty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: -1
    },
    max_storage_gb: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: -1
    },
    duration_months: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 12
    },
    features: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'subscriptions',
    timestamps: false
});

module.exports = Subscription;
