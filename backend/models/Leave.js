const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Leave = sequelize.define('Leave', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('sick', 'casual', 'maternity', 'paternity', 'unpaid'),
        allowNull: false
    },
    start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
    },
    remarks: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'leaves',
    timestamps: false
});

module.exports = Leave;
