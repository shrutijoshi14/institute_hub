const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FeePayment = sequelize.define('FeePayment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    amount_paid: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    payment_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    payment_mode: {
        type: DataTypes.STRING(255),
        defaultValue: 'Cash'
    },
    receipt_url: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'fee_payments',
    timestamps: false
});

module.exports = FeePayment;
