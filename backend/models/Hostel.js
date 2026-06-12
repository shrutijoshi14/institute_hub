const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Hostel = sequelize.define('Hostel', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('boys', 'girls', 'mixed'),
        defaultValue: 'mixed'
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'hostel',
    timestamps: false
});

module.exports = Hostel;
