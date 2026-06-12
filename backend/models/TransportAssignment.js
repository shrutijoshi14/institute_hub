const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TransportAssignment = sequelize.define('TransportAssignment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    route_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    bus_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    pickup_point: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'transport_assignments',
    timestamps: false
});

module.exports = TransportAssignment;
