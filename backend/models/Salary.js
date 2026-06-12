const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Salary = sequelize.define('Salary', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    month: {
        type: DataTypes.STRING,
        allowNull: false
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('paid', 'pending'),
        defaultValue: 'pending'
    },
    payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'salary',
    timestamps: false
});

module.exports = Salary;
