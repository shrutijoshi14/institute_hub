const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudentParentMap = sequelize.define('StudentParentMap', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    relation_type: {
        type: DataTypes.ENUM('father', 'mother', 'guardian', 'other'),
        defaultValue: 'guardian'
    },
    is_billing_contact: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_emergency_contact: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_transport_contact: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'student_parent_map',
    timestamps: false
});

module.exports = StudentParentMap;
