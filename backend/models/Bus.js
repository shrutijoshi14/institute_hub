const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Bus = sequelize.define('Bus', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    bus_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    driver_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    driver_phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'maintenance', 'inactive'),
        defaultValue: 'active'
    }
}, {
    tableName: 'buses',
    timestamps: false
});

module.exports = Bus;
