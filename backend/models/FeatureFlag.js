const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FeatureFlag = sequelize.define('FeatureFlag', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    feature_key: {
        type: DataTypes.STRING,
        allowNull: false
    },
    is_enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    tableName: 'feature_flags',
    timestamps: false
});

module.exports = FeatureFlag;
