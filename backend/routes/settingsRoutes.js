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

const DEFAULT_STANDARDS = [
    '5th', 
    '6th', 
    '7th', 
    '8th', 
    '9th', 
    'SSC (10th)', 
    '11th', 
    'HSC (12th)',
    'Diploma / Vocational'
];

const DEFAULT_BOARDS = [
    'CBSE', 
    'ICSE', 
    'CISCE', 
    'State Board', 
    'NIOS',
    'IB',
    'IGCSE',
    'Science (PCM)',
    'Science (PCB)',
    'Science (PCMB)',
    'Commerce',
    'Arts / Humanities',
    'Polytechnic',
    'ITI',
    'Diploma Engineering'
];

const DEFAULT_EXAMS = [
    'None', 
    'SOF Olympiads', 'NSO (Science)', 'IMO (Maths)', 'IEO (English)', 'NSTSE', 'Spell Bee', 'NTSE Foundation',
    'NTSE', 'Olympiads', 'JEE Foundation', 'NEET Foundation', 'NMMS', 'NSEJS',
    'JEE Main', 'JEE Advanced', 'MHT CET', 'BITSAT', 'VITEEE', 'SRMJEEE', 'NEET', 'AIIMS', 'JIPMER', 'IISER Aptitude Test', 'NEST', 'KVPY', 'NDA',
    'CA Foundation', 'CS Foundation', 'CMA', 'CUET', 'SET', 'NPAT', 'BBA Entrance', 'B.Com Entrance', 'Banking Exams',
    'UPSC Foundation', 'MPSC', 'SSC', 'CLAT', 'AILET', 'NID', 'NIFT', 'UCEED', 'BA Entrance Exams',
    'Polytechnic CET', 'ITI Entrance'
];

const DEFAULT_BOARDS_BY_STANDARD = {
    '5th': ['CBSE', 'ICSE', 'CISCE', 'State Board', 'NIOS', 'IB', 'IGCSE'],
    '6th': ['CBSE', 'ICSE', 'CISCE', 'State Board', 'NIOS', 'IB', 'IGCSE'],
    '7th': ['CBSE', 'ICSE', 'CISCE', 'State Board', 'NIOS', 'IB', 'IGCSE'],
    '8th': ['CBSE', 'ICSE', 'CISCE', 'State Board', 'NIOS', 'IB', 'IGCSE'],
    '9th': ['CBSE', 'ICSE', 'CISCE', 'State Board', 'NIOS', 'IB', 'IGCSE'],
    'SSC (10th)': ['CBSE', 'ICSE', 'CISCE', 'State Board', 'NIOS', 'IB', 'IGCSE'],
    '11th': ['Science (PCM)', 'Science (PCB)', 'Science (PCMB)', 'Commerce', 'Arts / Humanities'],
    'HSC (12th)': ['Science (PCM)', 'Science (PCB)', 'Science (PCMB)', 'Commerce', 'Arts / Humanities'],
    'Diploma / Vocational': ['Polytechnic', 'ITI', 'Diploma Engineering']
};

const DEFAULT_EXAMS_BY_STANDARD = {
    '5th': ['None', 'SOF Olympiads', 'NSO (Science)', 'IMO (Maths)', 'IEO (English)', 'NSTSE', 'Spell Bee', 'NTSE Foundation'],
    '6th': ['None', 'SOF Olympiads', 'NSO (Science)', 'IMO (Maths)', 'IEO (English)', 'NSTSE', 'Spell Bee', 'NTSE Foundation'],
    '7th': ['None', 'SOF Olympiads', 'NSO (Science)', 'IMO (Maths)', 'IEO (English)', 'NSTSE', 'Spell Bee', 'NTSE Foundation'],
    '8th': ['None', 'SOF Olympiads', 'NSO (Science)', 'IMO (Maths)', 'IEO (English)', 'NSTSE', 'Spell Bee', 'NTSE Foundation'],
    '9th': ['None', 'NTSE', 'Olympiads', 'JEE Foundation', 'NEET Foundation', 'NMMS', 'NSEJS'],
    'SSC (10th)': ['None', 'NTSE', 'Olympiads', 'JEE Foundation', 'NEET Foundation', 'NMMS', 'NSEJS'],
    '11th': ['None', 'JEE Main', 'JEE Advanced', 'MHT CET', 'BITSAT', 'VITEEE', 'SRMJEEE', 'NEET', 'AIIMS', 'JIPMER', 'IISER Aptitude Test', 'NEST', 'KVPY', 'NDA', 'CA Foundation', 'CS Foundation', 'CMA', 'CUET', 'SET', 'NPAT', 'BBA Entrance', 'B.Com Entrance', 'Banking Exams', 'UPSC Foundation', 'MPSC', 'SSC', 'CLAT', 'AILET', 'NID', 'NIFT', 'UCEED', 'BA Entrance Exams'],
    'HSC (12th)': ['None', 'JEE Main', 'JEE Advanced', 'MHT CET', 'BITSAT', 'VITEEE', 'SRMJEEE', 'NEET', 'AIIMS', 'JIPMER', 'IISER Aptitude Test', 'NEST', 'KVPY', 'NDA', 'CA Foundation', 'CS Foundation', 'CMA', 'CUET', 'SET', 'NPAT', 'BBA Entrance', 'B.Com Entrance', 'Banking Exams', 'UPSC Foundation', 'MPSC', 'SSC', 'CLAT', 'AILET', 'NID', 'NIFT', 'UCEED', 'BA Entrance Exams'],
    'Diploma / Vocational': ['None', 'Polytechnic CET', 'ITI Entrance']
};

const { getSettings, updateSettingsCache } = require('../config/settingsCache');
const Setting = require('../models/Setting');

// Helper to read settings
const readSettings = () => {
    return getSettings();
};

// Helper to write settings
const writeSettings = async (settings) => {
    try {
        for (const [key, value] of Object.entries(settings)) {
            await Setting.upsert({
                key,
                value: JSON.stringify(value)
            });
        }
        updateSettingsCache(settings);
    } catch (e) {
        console.error('Error writing settings to DB:', e);
        throw e;
    }
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
router.put('/', async (req, res) => {
    try {
        const currentSettings = readSettings();
        const newSettings = {
            ...currentSettings,
            ...req.body
        };

        await writeSettings(newSettings);
        res.json(newSettings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
