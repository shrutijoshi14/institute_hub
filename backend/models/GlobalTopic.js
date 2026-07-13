const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const GlobalChapter = require('./GlobalChapter');

const GlobalTopic = sequelize.define('GlobalTopic', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    chapter_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: GlobalChapter,
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    teaching_hours: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    learning_outcomes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'global_topics',
    timestamps: false
});

GlobalChapter.hasMany(GlobalTopic, { foreignKey: 'chapter_id', onDelete: 'CASCADE' });
GlobalTopic.belongsTo(GlobalChapter, { foreignKey: 'chapter_id' });

module.exports = GlobalTopic;
