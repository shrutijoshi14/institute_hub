const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BatchFaculty = sequelize.define('BatchFaculty', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    batch_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    faculty_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'batch_faculty',
    timestamps: false
});

module.exports = BatchFaculty;
