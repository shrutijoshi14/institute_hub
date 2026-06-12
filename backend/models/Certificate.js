const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Certificate = sequelize.define('Certificate', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('Transfer', 'Character', 'Bonafide', 'Achievement'),
        allowNull: false
    },
    issue_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    certificate_url: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'certificates',
    timestamps: false
});

module.exports = Certificate;
