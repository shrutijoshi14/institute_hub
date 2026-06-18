const { getSettings } = require('./settingsCache');

const getDomain = () => {
    try {
        const settings = getSettings();
        if (settings && settings.contactEmail && settings.contactEmail.includes('@')) {
            const domain = settings.contactEmail.split('@')[1];
            if (domain) return domain;
        }
    } catch (e) {
        console.error('getDomain error:', e);
    }
    return 'institute.com';
};

module.exports = { getDomain };
