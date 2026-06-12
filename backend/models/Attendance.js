const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('present', 'absent', 'late'),
        defaultValue: 'present'
    },
    batch_progress_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'attendance',
    timestamps: false
});

module.exports = Attendance;
