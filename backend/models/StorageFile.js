const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StorageFile = sequelize.define('StorageFile', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    file_type: {
        type: DataTypes.ENUM('Image', 'Document', 'Certificate', 'Video', 'Report'),
        allowNull: false
    },
    size_kb: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    file_path: {
        type: DataTypes.STRING,
        allowNull: false
    },
    uploaded_by: {
        type: DataTypes.STRING,
        allowNull: true
    },
    created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'storage_files',
    timestamps: false
});

module.exports = StorageFile;
