const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Faculty = sequelize.define('Faculty', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    qualification: {
        type: DataTypes.STRING,
        allowNull: false
    },
    experience: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subject_expertise: {
        type: DataTypes.STRING,
        allowNull: false
    },
    image_url: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'faculty',
    timestamps: false
});

module.exports = Faculty;
