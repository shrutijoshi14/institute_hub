const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../config/settings.json');

// Helper to read settings
const readSettings = () => {
    if (fs.existsSync(SETTINGS_FILE)) {
        const data = fs.readFileSync(SETTINGS_FILE);
        return JSON.parse(data);
    }
    return { schoolName: 'Institute Hub', logoUrl: '', contactEmail: 'info@institute.com', iconName: 'GraduationCap' };
};

// Helper to write settings
const writeSettings = (settings) => {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 4));
};

// @route   GET /api/settings
// @desc    Get School Settings
router.get('/', (req, res) => {
    try {
        const settings = readSettings();
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   PUT /api/settings
// @desc    Update School Settings
router.put('/', (req, res) => {
    try {
        const { schoolName, logoUrl, contactEmail, iconName } = req.body;
        const currentSettings = readSettings();
        
        const newSettings = {
            ...currentSettings,
            schoolName: schoolName !== undefined ? schoolName : currentSettings.schoolName,
            logoUrl: logoUrl !== undefined ? logoUrl : currentSettings.logoUrl,
            contactEmail: contactEmail !== undefined ? contactEmail : currentSettings.contactEmail,
            iconName: iconName !== undefined ? iconName : currentSettings.iconName
        };

        writeSettings(newSettings);
        res.json(newSettings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
