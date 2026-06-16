const fs = require('fs');
const path = require('path');

/**
 * Gets the fee for a given standard, falling back to settings.json or default mappings.
 * @param {string} standard 
 * @param {object|number} courseIdOrObj 
 * @returns {number}
 */
const getStandardFee = (standard, courseIdOrObj = null) => {
    // 1. First, check settings.json
    try {
        const settingsPath = path.join(__dirname, '../config/settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath));
            if (settings.standardFees && settings.standardFees[standard] !== undefined) {
                const fee = parseFloat(settings.standardFees[standard]);
                if (fee > 0) return fee;
            }
        }
    } catch (err) {
        console.error('Error reading settings.json for standard fees:', err);
    }

    // 2. Fallback to course fees if provided
    if (courseIdOrObj) {
        const feesVal = typeof courseIdOrObj === 'object' ? courseIdOrObj.fees : null;
        if (feesVal && parseFloat(feesVal) > 0) {
            return parseFloat(feesVal);
        }
    }

    // 3. Fallback standard defaults
    const defaults = {
        '5th': 25000,
        '6th': 28000,
        '7th': 30000,
        '8th': 32000,
        '9th': 35000,
        'SSC (10th)': 60000,
        '11th': 40000,
        'HSC (12th)': 50000,
        'Diploma / Vocational': 45000
    };

    return defaults[standard] || 50000;
};

/**
 * Gets a clean default title for a course based on the standard.
 * @param {string} standard 
 * @returns {string}
 */
const getStandardCourseTitle = (standard) => {
    const defaults = {
        '5th': '5th Standard Mastery',
        '6th': '6th Standard Mastery',
        '7th': '7th Standard Mastery',
        '8th': '8th Standard Mastery',
        '9th': '9th Standard Mastery',
        'SSC (10th)': '10th Board Mastery (SSC)',
        '11th': '11th Standard Mastery',
        'HSC (12th)': '12th Commerce Board Mastery',
        'Diploma / Vocational': 'Diploma Program'
    };
    return defaults[standard] || `${standard} Standard Course`;
};

/**
 * Generates a SQL CASE statement to resolve standard fees dynamically.
 * @param {string} standardField 
 * @param {string} batchIdField 
 * @returns {string}
 */
const getStandardFeeSqlFragment = (standardField = 'u.standard', batchIdField = 'e.batch_id') => {
    let feesObj = {
        '5th': 25000,
        '6th': 28000,
        '7th': 30000,
        '8th': 32000,
        '9th': 35000,
        'SSC (10th)': 60000,
        '11th': 40000,
        'HSC (12th)': 50000,
        'Diploma / Vocational': 45000
    };
    try {
        const settingsPath = path.join(__dirname, '../config/settings.json');
        if (fs.existsSync(settingsPath)) {
            const settings = JSON.parse(fs.readFileSync(settingsPath));
            if (settings.standardFees) {
                feesObj = { ...feesObj, ...settings.standardFees };
            }
        }
    } catch (err) {
        console.error('Error loading settings.json for SQL fragment:', err);
    }

    let cases = '';
    for (const [std, fee] of Object.entries(feesObj)) {
        const safeStd = std.replace(/'/g, "''");
        cases += `WHEN '${safeStd}' THEN ${parseFloat(fee) || 0} `;
    }

    return `CASE COALESCE(${standardField}, (SELECT standard FROM batches WHERE id = ${batchIdField}))
        ${cases}
        ELSE 50000
    END`;
};

/**
 * Generates a SQL CASE statement to resolve standard course titles dynamically.
 * @param {string} standardField 
 * @param {string} batchIdField 
 * @returns {string}
 */
const getStandardCourseTitleSqlFragment = (standardField = 'u.standard', batchIdField = 'e.batch_id') => {
    const titlesObj = {
        '5th': '5th Standard Mastery',
        '6th': '6th Standard Mastery',
        '7th': '7th Standard Mastery',
        '8th': '8th Standard Mastery',
        '9th': '9th Standard Mastery',
        'SSC (10th)': '10th Board Mastery (SSC)',
        '11th': '11th Standard Mastery',
        'HSC (12th)': '12th Commerce Board Mastery',
        'Diploma / Vocational': 'Diploma Program'
    };
    let cases = '';
    for (const [std, title] of Object.entries(titlesObj)) {
        const safeStd = std.replace(/'/g, "''");
        const safeTitle = title.replace(/'/g, "''");
        cases += `WHEN '${safeStd}' THEN '${safeTitle}' `;
    }
    return `CASE COALESCE(${standardField}, (SELECT standard FROM batches WHERE id = ${batchIdField}))
        ${cases}
        ELSE 'General Course'
    END`;
};

module.exports = {
    getStandardFee,
    getStandardCourseTitle,
    getStandardFeeSqlFragment,
    getStandardCourseTitleSqlFragment
};
