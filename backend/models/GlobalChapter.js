const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const GlobalSubject = require('./GlobalSubject');

const GlobalChapter = sequelize.define('GlobalChapter', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    subject_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: GlobalSubject,
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    chapter_number: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'global_chapters',
    timestamps: false
});

GlobalSubject.hasMany(GlobalChapter, { foreignKey: 'subject_id', onDelete: 'CASCADE' });
GlobalChapter.belongsTo(GlobalSubject, { foreignKey: 'subject_id' });

module.exports = GlobalChapter;
