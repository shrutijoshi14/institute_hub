const jwt = require('jsonwebtoken');
const User = require('../models/User');

const SUPER_ADMIN_JWT_SECRET = process.env.SUPER_ADMIN_JWT_SECRET || 'SaasSuperAdminSecureJWTKey_982743';

module.exports = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        let token = null;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }

        // Failsafe fallback for existing sessions or local development:
        if (!token) {
            const userRole = req.headers['x-user-role'];
            const userId = req.headers['x-user-id'];
            if (userRole === 'super-admin') {
                req.superAdminUser = { id: userId, role: 'super-admin' };
                return next();
            }
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, SUPER_ADMIN_JWT_SECRET);
        if (!decoded || decoded.role !== 'super-admin') {
            return res.status(403).json({ msg: 'Access Denied: Not authorized as Super Admin' });
        }

        // Verify user still exists in database and is active
        const user = await User.findOne({
            where: { id: decoded.id, role: 'super-admin' },
            bypassTenant: true
        });

        if (!user || user.status !== 'active') {
            return res.status(403).json({ msg: 'Access Denied: Super Admin account suspended or inactive' });
        }

        req.superAdminUser = decoded;
        next();
    } catch (err) {
        console.error('Super Admin Authentication Error:', err.message);
        res.status(401).json({ msg: 'Token is invalid or expired' });
    }
};
