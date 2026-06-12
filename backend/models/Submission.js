const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Submission = sequelize.define('Submission', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    assignment_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    submission_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'submitted' // e.g., submitted, graded
    },
    file_path: {
        type: DataTypes.STRING,
        allowNull: true
    },
    marks: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    feedback: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'submissions',
    timestamps: false
});

module.exports = Submission;
