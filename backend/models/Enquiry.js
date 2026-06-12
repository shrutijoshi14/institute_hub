const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Enquiry = sequelize.define('Enquiry', {
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
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false
    },
    class_range: {
        type: DataTypes.STRING,
        allowNull: false
    },
    board: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'State Board'
    },
    exam_target: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'None'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'New'
    },
    lost_reason: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Detailed Student Fields added for full registration flow
    parent_name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    parent_phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    dob: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    blood_group: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'enquiries',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Enquiry;
