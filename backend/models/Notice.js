const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notice = sequelize.define('Notice', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    target_role: {
        type: DataTypes.ENUM('all', 'student', 'parent'),
        defaultValue: 'all'
    },
    target_standard: {
        type: DataTypes.STRING,
        defaultValue: 'All'
    },
    target_board: {
        type: DataTypes.STRING,
        defaultValue: 'All'
    },
    target_exam: {
        type: DataTypes.STRING,
        defaultValue: 'All'
    },
    target_batch: {
        type: DataTypes.STRING,
        defaultValue: 'All'
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'notices',
    timestamps: false
});

module.exports = Notice;
