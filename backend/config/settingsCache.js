const fs = require('fs');
const path = require('path');

let settingsCache = {};
// DEFAULT_SETTINGS definition...

const DEFAULT_SETTINGS = {
    schoolName: 'Vasudev Classes',
    logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTp6_MRevJUwA2Ios69DSa7pli0hqdyBbaTd3XOFUiVFQ&s=10',
    contactEmail: 'vasudev@gmail.com',
    contactPhone: '+91 98765 43210',
    iconName: 'GraduationCap',
    address: '123, Tech Park, Sector 62, Noida, Uttar Pradesh - 201309',
    gstin: '09ABCDE1234F1Z5',
    bankName: 'HDFC Bank',
    accountName: 'Vasudev Classes',
    accountNumber: '50200012345678',
    ifscCode: 'HDFC0001234',
    upiId: 'vasudev@upi',
    standardFees: {
        "5th": 25000,
        "6th": 28000,
        "7th": 30000,
        "8th": 32000,
        "9th": 35000,
        "SSC (10th)": 60000,
        "11th": 40000,
        "HSC (12th)": 50000,
        "Diploma / Vocational": 44999
    },
    boardExamCosts: [],
    standards: ["5th", "6th", "7th", "8th", "9th", "SSC (10th)", "11th", "HSC (12th)", "Diploma / Vocational"],
    boards: ["CBSE", "ICSE", "CISCE", "State Board", "NIOS", "IB", "IGCSE", "Science (PCM)", "Science (PCB)", "Science (PCMB)", "Commerce", "Arts / Humanities", "Polytechnic", "ITI", "Diploma Engineering"],
    exams: ["None", "SOF Olympiads", "NSO (Science)", "IMO (Maths)", "IEO (English)", "NSTSE", "Spell Bee", "NTSE Foundation", "NTSE", "Olympiads", "JEE Foundation", "NEET Foundation", "NMMS", "NSEJS", "JEE Main", "JEE Advanced", "MHT CET", "BITSAT", "VITEEE", "SRMJEEE", "NEET", "AIIMS", "JIPMER", "IISER Aptitude Test", "NEST", "KVPY", "NDA", "CA Foundation", "CS Foundation", "CMA", "CUET", "SET", "NPAT", "BBA Entrance", "B.Com Entrance", "Banking Exams", "UPSC Foundation", "MPSC", "SSC", "CLAT", "AILET", "NID", "NIFT", "UCEED", "BA Entrance Exams", "Polytechnic CET", "ITI Entrance"],
    boardsByStandard: {
        "5th": ["CBSE", "ICSE", "CISCE", "State Board", "NIOS", "IB", "IGCSE"],
        "6th": ["CBSE", "ICSE", "CISCE", "State Board", "NIOS", "IB", "IGCSE"],
        "7th": ["CBSE", "ICSE", "CISCE", "State Board", "NIOS", "IB", "IGCSE"],
        "8": ["CBSE", "ICSE", "CISCE", "State Board", "NIOS", "IB", "IGCSE"],
        "8th": ["CBSE", "ICSE", "CISCE", "State Board", "NIOS", "IB", "IGCSE"],
        "9th": ["CBSE", "ICSE", "CISCE", "State Board", "NIOS", "IB", "IGCSE"],
        "SSC (10th)": ["CBSE", "ICSE", "CISCE", "State Board", "NIOS", "IB", "IGCSE"],
        "11th": ["Science (PCM)", "Science (PCB)", "Science (PCMB)", "Commerce", "Arts / Humanities"],
        "HSC (12th)": ["Science (PCM)", "Science (PCB)", "Science (PCMB)", "Commerce", "Arts / Humanities"],
        "Diploma / Vocational": ["Polytechnic", "ITI", "Diploma Engineering"]
    },
    examsByStandard: {
        "5th": ["None", "SOF Olympiads", "NSO (Science)", "IMO (Maths)", "IEO (English)", "NSTSE", "Spell Bee", "NTSE Foundation"],
        "6th": ["None", "SOF Olympiads", "NSO (Science)", "IMO (Maths)", "IEO (English)", "NSTSE", "Spell Bee", "NTSE Foundation"],
        "7th": ["None", "SOF Olympiads", "NSO (Science)", "IMO (Maths)", "IEO (English)", "NSTSE", "Spell Bee", "NTSE Foundation"],
        "8th": ["None", "SOF Olympiads", "NSO (Science)", "IMO (Maths)", "IEO (English)", "NSTSE", "Spell Bee", "NTSE Foundation"],
        "9th": ["None", "NTSE", "Olympiads", "JEE Foundation", "NEET Foundation", "NMMS", "NSEJS"],
        "SSC (10th)": ["None", "NTSE", "Olympiads", "JEE Foundation", "NEET Foundation", "NMMS", "NSEJS"],
        "11th": ["None", "JEE Main", "JEE Advanced", "MHT CET", "BITSAT", "VITEEE", "SRMJEEE", "NEET", "AIIMS", "JIPMER", "IISER Aptitude Test", "NEST", "KVPY", "NDA", "CA Foundation", "CS Foundation", "CMA", "CUET", "SET", "NPAT", "BBA Entrance", "B.Com Entrance", "Banking Exams", "UPSC Foundation", "MPSC", "SSC", "CLAT", "AILET", "NID", "NIFT", "UCEED", "BA Entrance Exams"],
        "HSC (12th)": ["None", "JEE Main", "JEE Advanced", "MHT CET", "BITSAT", "VITEEE", "SRMJEEE", "NEET", "AIIMS", "JIPMER", "IISER Aptitude Test", "NEST", "KVPY", "NDA", "CA Foundation", "CS Foundation", "CMA", "CUET", "SET", "NPAT", "BBA Entrance", "B.Com Entrance", "Banking Exams", "UPSC Foundation", "MPSC", "SSC", "CLAT", "AILET", "NID", "NIFT", "UCEED", "BA Entrance Exams"],
        "Diploma / Vocational": ["None", "Polytechnic CET", "ITI Entrance"]
    }
};

const initializeSettings = async () => {
    const Setting = require('../models/Setting');
    try {
        // Find all settings from the database
        const dbSettings = await Setting.findAll();
        
        if (dbSettings.length === 0) {
            console.log('⚠️ Settings table is empty in database. Seeding from local settings.json or defaults...');
            
            // Try reading from settings.json
            let initialSettings = { ...DEFAULT_SETTINGS };
            const settingsJsonPath = path.join(__dirname, 'settings.json'); // Wait, settings.json is in backend/config/settings.json
            const settingsJsonPathAlternative = path.join(__dirname, 'settings.json');
            const actualPath = fs.existsSync(settingsJsonPath) 
                ? settingsJsonPath 
                : path.join(__dirname, '../config/settings.json');

            if (fs.existsSync(actualPath)) {
                try {
                    const fileData = JSON.parse(fs.readFileSync(actualPath, 'utf8'));
                    initialSettings = { ...initialSettings, ...fileData };
                    console.log('✅ Loaded initial settings from settings.json');
                } catch (jsonErr) {
                    console.error('Failed to parse settings.json:', jsonErr);
                }
            }

            // Seed database
            for (const [key, value] of Object.entries(initialSettings)) {
                await Setting.create({
                    key,
                    value: JSON.stringify(value)
                });
            }
            console.log('✅ Successfully seeded settings table in database.');
            settingsCache = initialSettings;
        } else {
            // Populate cache from DB
            const settingsMap = {};
            dbSettings.forEach(row => {
                try {
                    settingsMap[row.key] = JSON.parse(row.value);
                } catch (e) {
                    settingsMap[row.key] = row.value;
                }
            });

            // Ensure any missing default settings are populated
            const mergedSettings = { ...DEFAULT_SETTINGS, ...settingsMap };
            settingsCache = mergedSettings;
            console.log('✅ Loaded settings from database into cache.');
        }
    } catch (err) {
        console.error('Error initializing settings cache:', err);
        // Fallback to default in case database is down or not ready yet
        settingsCache = { ...DEFAULT_SETTINGS };
    }
};

const getSettings = () => {
    return settingsCache;
};

const updateSettingsCache = (newSettings) => {
    settingsCache = { ...settingsCache, ...newSettings };
};

module.exports = {
    initializeSettings,
    getSettings,
    updateSettingsCache
};
