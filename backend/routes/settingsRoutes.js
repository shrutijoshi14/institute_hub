const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../config/settings.json');

const DEFAULT_STANDARD_FEES = {
    "5th": 25000,
    "6th": 28000,
    "7th": 30000,
    "8th": 32000,
    "9th": 35000,
    "SSC (10th)": 60000,
    "11th": 40000,
    "HSC (12th)": 50000,
    "Diploma / Vocational": 45000
};

// Helper to read settings
const readSettings = () => {
    let settings = { 
        schoolName: 'Institute Hub', 
        logoUrl: '', 
        contactEmail: 'info@institute.com', 
        iconName: 'GraduationCap',
        standardFees: DEFAULT_STANDARD_FEES,
        boardExamCosts: []
    };
    if (fs.existsSync(SETTINGS_FILE)) {
        try {
            const data = fs.readFileSync(SETTINGS_FILE);
            settings = { ...settings, ...JSON.parse(data) };
        } catch (e) {
            console.error('Error parsing settings:', e);
        }
    }
    if (!settings.standardFees) {
        settings.standardFees = DEFAULT_STANDARD_FEES;
    }
    if (!settings.boardExamCosts) {
        settings.boardExamCosts = [];
    }
    return settings;
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
        const { schoolName, logoUrl, contactEmail, iconName, standardFees, boardExamCosts } = req.body;
        const currentSettings = readSettings();
        
        const newSettings = {
            ...currentSettings,
            schoolName: schoolName !== undefined ? schoolName : currentSettings.schoolName,
            logoUrl: logoUrl !== undefined ? logoUrl : currentSettings.logoUrl,
            contactEmail: contactEmail !== undefined ? contactEmail : currentSettings.contactEmail,
            iconName: iconName !== undefined ? iconName : currentSettings.iconName,
            standardFees: standardFees !== undefined ? standardFees : currentSettings.standardFees,
            boardExamCosts: boardExamCosts !== undefined ? boardExamCosts : currentSettings.boardExamCosts
        };

        writeSettings(newSettings);
        res.json(newSettings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
