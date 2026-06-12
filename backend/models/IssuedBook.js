const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const IssuedBook = sequelize.define('IssuedBook', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    book_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    issue_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    return_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('issued', 'returned', 'overdue'),
        defaultValue: 'issued'
    },
    fine_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    }
}, {
    tableName: 'issued_books',
    timestamps: false
});

module.exports = IssuedBook;
