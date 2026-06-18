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

// Helper to read settings
const readSettings = () => {
    let settings = { 
        schoolName: 'Institute Hub', 
        logoUrl: '', 
        contactEmail: 'info@institute.com', 
        iconName: 'GraduationCap',
        standardFees: DEFAULT_STANDARD_FEES,
        boardExamCosts: [],
        standards: DEFAULT_STANDARDS,
        boards: DEFAULT_BOARDS,
        exams: DEFAULT_EXAMS,
        boardsByStandard: DEFAULT_BOARDS_BY_STANDARD,
        examsByStandard: DEFAULT_EXAMS_BY_STANDARD
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
    if (!settings.standards) {
        settings.standards = DEFAULT_STANDARDS;
    }
    if (!settings.boards) {
        settings.boards = DEFAULT_BOARDS;
    }
    if (!settings.exams) {
        settings.exams = DEFAULT_EXAMS;
    }
    if (!settings.boardsByStandard) {
        settings.boardsByStandard = DEFAULT_BOARDS_BY_STANDARD;
    }
    if (!settings.examsByStandard) {
        settings.examsByStandard = DEFAULT_EXAMS_BY_STANDARD;
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
        const { 
            schoolName, 
            logoUrl, 
            contactEmail, 
            iconName, 
            standardFees, 
            boardExamCosts,
            standards,
            boards,
            exams,
            boardsByStandard,
            examsByStandard
        } = req.body;
        const currentSettings = readSettings();
        
        const newSettings = {
            ...currentSettings,
            schoolName: schoolName !== undefined ? schoolName : currentSettings.schoolName,
            logoUrl: logoUrl !== undefined ? logoUrl : currentSettings.logoUrl,
            contactEmail: contactEmail !== undefined ? contactEmail : currentSettings.contactEmail,
            iconName: iconName !== undefined ? iconName : currentSettings.iconName,
            standardFees: standardFees !== undefined ? standardFees : currentSettings.standardFees,
            boardExamCosts: boardExamCosts !== undefined ? boardExamCosts : currentSettings.boardExamCosts,
            standards: standards !== undefined ? standards : currentSettings.standards,
            boards: boards !== undefined ? boards : currentSettings.boards,
            exams: exams !== undefined ? exams : currentSettings.exams,
            boardsByStandard: boardsByStandard !== undefined ? boardsByStandard : currentSettings.boardsByStandard,
            examsByStandard: examsByStandard !== undefined ? examsByStandard : currentSettings.examsByStandard
        };

        writeSettings(newSettings);
        res.json(newSettings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
