const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GlobalBoard = sequelize.define('GlobalBoard', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'global_boards',
    timestamps: false
});

module.exports = GlobalBoard;
