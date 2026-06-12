const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LibraryBook = sequelize.define('LibraryBook', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    author: {
        type: DataTypes.STRING,
        allowNull: false
    },
    isbn: {
        type: DataTypes.STRING,
        allowNull: true
    },
    category: {
        type: DataTypes.STRING,
        allowNull: true
    },
    total_copies: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    },
    available_copies: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    tableName: 'library_books',
    timestamps: false
});

module.exports = LibraryBook;
