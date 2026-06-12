const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BatchProgress = sequelize.define('BatchProgress', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    batch_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    course_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('Pending', 'In Progress', 'Completed'),
        defaultValue: 'Pending',
        allowNull: false
    },
    remarks: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    duration_hours: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    duration_minutes: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    class_time: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'batch_progress',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = BatchProgress;
