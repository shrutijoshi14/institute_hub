const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const GlobalTopic = require('./GlobalTopic');

const GlobalQuestion = sequelize.define('GlobalQuestion', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    topic_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: GlobalTopic,
            key: 'id'
        }
    },
    question_text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    question_type: {
        type: DataTypes.ENUM('MCQ', 'Short', 'Long'),
        allowNull: false,
        defaultValue: 'Short'
    },
    difficulty: {
        type: DataTypes.ENUM('Easy', 'Medium', 'Hard'),
        allowNull: false,
        defaultValue: 'Medium'
    },
    answer_key: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'global_questions',
    timestamps: false
});

GlobalTopic.hasMany(GlobalQuestion, { foreignKey: 'topic_id', onDelete: 'CASCADE' });
GlobalQuestion.belongsTo(GlobalTopic, { foreignKey: 'topic_id' });

module.exports = GlobalQuestion;
