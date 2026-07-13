const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    standard: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    dob: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    blood_group: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    biometric_credential_id: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    biometric_public_key: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    biometric_sign_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'students',
    timestamps: false
});

module.exports = Student;
