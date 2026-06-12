const fs = require('fs');
const path = require('path');

const getDomain = () => {
    try {
        const file = path.join(__dirname, 'settings.json');
        if (fs.existsSync(file)) {
            const settings = JSON.parse(fs.readFileSync(file));
            if (settings.contactEmail && settings.contactEmail.includes('@')) {
                const domain = settings.contactEmail.split('@')[1];
                if (domain) return domain;
            }
        }
    } catch (e) {
        console.error('getDomain error:', e);
    }
    return 'institute.com';
};

module.exports = { getDomain };
