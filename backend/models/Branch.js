const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Branch = sequelize.define('Branch', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contact_email: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'branches',
    timestamps: false
});

module.exports = Branch;
