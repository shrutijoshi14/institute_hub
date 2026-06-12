const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Route = sequelize.define('Route', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    route_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    start_point: {
        type: DataTypes.STRING,
        allowNull: false
    },
    end_point: {
        type: DataTypes.STRING,
        allowNull: false
    },
    stops: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    }
}, {
    tableName: 'routes',
    timestamps: false
});

module.exports = Route;
