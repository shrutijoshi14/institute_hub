const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Assignment = sequelize.define('Assignment', {
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
    due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    course_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    file_url: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'assignments',
    timestamps: false
});

module.exports = Assignment;
