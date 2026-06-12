const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Room = sequelize.define('Room', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    hostel_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    room_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('single', 'double', 'triple', 'dormitory'),
        defaultValue: 'double'
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2
    },
    occupied: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    }
}, {
    tableName: 'rooms',
    timestamps: false
});

module.exports = Room;
