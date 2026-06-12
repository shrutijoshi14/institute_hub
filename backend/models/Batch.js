const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Batch = sequelize.define('Batch', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    standard: {
        type: DataTypes.STRING,
        allowNull: false
    },
    board: {
        type: DataTypes.STRING,
        allowNull: false
    },
    timing: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'batches',
    timestamps: false
});

module.exports = Batch;
