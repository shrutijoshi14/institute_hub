const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const GlobalBoard = require('./GlobalBoard');

const GlobalSyllabusVersion = sequelize.define('GlobalSyllabusVersion', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    board_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: GlobalBoard,
            key: 'id'
        }
    },
    version: {
        type: DataTypes.STRING,
        allowNull: false
    },
    changes_summary: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Draft', 'Active', 'Deprecated'),
        allowNull: false,
        defaultValue: 'Draft'
    },
    effective_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'global_syllabus_versions',
    timestamps: false
});

GlobalBoard.hasMany(GlobalSyllabusVersion, { foreignKey: 'board_id', onDelete: 'CASCADE' });
GlobalSyllabusVersion.belongsTo(GlobalBoard, { foreignKey: 'board_id' });

module.exports = GlobalSyllabusVersion;
