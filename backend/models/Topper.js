const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Topper = sequelize.define('Topper', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    batch: {
        type: DataTypes.STRING,
        allowNull: false
    },
    class: {
        type: DataTypes.STRING,
        allowNull: false
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'toppers',
    timestamps: false
});

module.exports = Topper;
