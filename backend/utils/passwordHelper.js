const bcrypt = require('bcryptjs');

/**
 * Generates a secure temporary password meeting enterprise standards:
 * At least 10 characters, with uppercase, lowercase, digit, and special symbol.
 */
const generateTempPassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const specials = '@#$%&*';
    const all = uppercase + lowercase + digits + specials;
    
    let pass = '';
    // Guarantee at least one of each class is present
    pass += uppercase[Math.floor(Math.random() * uppercase.length)];
    pass += lowercase[Math.floor(Math.random() * lowercase.length)];
    pass += digits[Math.floor(Math.random() * digits.length)];
    pass += specials[Math.floor(Math.random() * specials.length)];
    
    for (let i = 0; i < 6; i++) {
        pass += all[Math.floor(Math.random() * all.length)];
    }
    
    // Shuffle the generated characters
    return pass.split('').sort(() => 0.5 - Math.random()).join('');
};

/**
 * Hashes a plain-text password using bcrypt.
 */
const hashPassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

/**
 * Compares a plain-text password with a hash.
 * Supports fallback to plain-text equality for backward compatibility with seeded test accounts.
 */
const comparePassword = async (password, storedPassword) => {
    if (!storedPassword) return false;
    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
        return await bcrypt.compare(password, storedPassword);
    }
    return password === storedPassword;
};

module.exports = {
    generateTempPassword,
    hashPassword,
    comparePassword
};
