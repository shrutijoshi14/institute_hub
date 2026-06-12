const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Result = sequelize.define('Result', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    subject: {
        type: DataTypes.STRING,
        allowNull: false
    },
    marks_obtained: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    total_marks: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    exam_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    comments: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'results',
    timestamps: false
});

module.exports = Result;
