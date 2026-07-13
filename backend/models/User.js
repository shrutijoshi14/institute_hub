const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('super-admin', 'admin', 'faculty', 'parent', 'student', 'accountant', 'receptionist', 'librarian', 'transport-manager'),
        allowNull: false
    },
    branch_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'active', 'suspended'),
        defaultValue: 'pending'
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: true
    },
    google_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    otp_code: {
        type: DataTypes.STRING,
        allowNull: true
    },
    otp_expiry: {
        type: DataTypes.DATE,
        allowNull: true
    },
    biometric_credential_id: {
        type: DataTypes.STRING,
        allowNull: true
    },
    biometric_public_key: {
        type: DataTypes.STRING,
        allowNull: true
    },
    biometric_sign_count: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    login_attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    lockout_until: {
        type: DataTypes.DATE,
        allowNull: true
    },
    last_login_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    last_login_ip: {
        type: DataTypes.STRING,
        allowNull: true
    },
    last_login_agent: {
        type: DataTypes.STRING,
        allowNull: true
    },
    must_change_password: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = User;
