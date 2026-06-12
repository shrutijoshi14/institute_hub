const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Visitor = sequelize.define('Visitor', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    purpose: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contact: {
        type: DataTypes.STRING,
        allowNull: false
    },
    check_in: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    check_out: {
        type: DataTypes.DATE,
        allowNull: true
    },
    remarks: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'visitors',
    timestamps: false
});

module.exports = Visitor;
