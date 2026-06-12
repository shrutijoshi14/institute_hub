const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Enrollment = sequelize.define('Enrollment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    course_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    batch_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    batch_year: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fee_plan: {
        type: DataTypes.ENUM('One-time', 'EMI'),
        defaultValue: 'One-time'
    },
    total_installments: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    installment_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    next_due_date: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    tableName: 'enrollments',
    timestamps: false
});

module.exports = Enrollment;
