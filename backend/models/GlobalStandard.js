const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const GlobalBoard = require('./GlobalBoard');

const GlobalStandard = sequelize.define('GlobalStandard', {
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
    name: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'global_standards',
    timestamps: false
});

GlobalBoard.hasMany(GlobalStandard, { foreignKey: 'board_id', onDelete: 'CASCADE' });
GlobalStandard.belongsTo(GlobalBoard, { foreignKey: 'board_id' });

module.exports = GlobalStandard;
