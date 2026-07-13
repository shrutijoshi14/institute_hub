const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const GlobalStandard = require('./GlobalStandard');

const GlobalSubject = sequelize.define('GlobalSubject', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    standard_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: GlobalStandard,
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'global_subjects',
    timestamps: false
});

GlobalStandard.hasMany(GlobalSubject, { foreignKey: 'standard_id', onDelete: 'CASCADE' });
GlobalSubject.belongsTo(GlobalStandard, { foreignKey: 'standard_id' });

module.exports = GlobalSubject;
