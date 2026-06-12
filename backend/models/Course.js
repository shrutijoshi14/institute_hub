const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Course = sequelize.define('Course', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'General'
    },
    class_range: {
        type: DataTypes.STRING,
        allowNull: false
    },
    board: {
        type: DataTypes.STRING,
        allowNull: false
    },
    exam_target: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'None'
    },
    fees: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    syllabus_url: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'courses',
    timestamps: false
});

module.exports = Course;
