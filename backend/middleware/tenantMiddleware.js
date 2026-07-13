const tenantStorage = require('../config/tenantContext');
const Institute = require('../models/Institute');

module.exports = async (req, res, next) => {
    try {
        let tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
        const subdomain = req.headers['x-tenant-subdomain'];

        // If subdomain is passed but not tenantId, lookup the tenant ID from the database
        if (!tenantId && subdomain) {
            const institute = await Institute.findOne({
                where: { subdomain },
                bypassTenant: true // Bypass scoping for this query since we are doing tenant lookup
            });
            if (institute) {
                tenantId = institute.id;
            }
        }

        // Failsafe fallback: default to tenant 1 (Ambition Tutorials) for backward compatibility/local test dev
        if (!tenantId) {
            tenantId = 1;
        } else {
            tenantId = parseInt(tenantId, 10);
        }

        // Run the next middleware/routes inside the AsyncLocalStorage transaction context
        tenantStorage.run({ tenantId }, () => {
            req.tenantId = tenantId;
            next();
        });
    } catch (err) {
        console.error('Tenant Middleware Error:', err);
        // On error, default to tenant 1 and proceed safely rather than crashing the request
        tenantStorage.run({ tenantId: 1 }, () => {
            req.tenantId = 1;
            next();
        });
    }
};
