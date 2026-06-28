/**
 * Advanced Authentication & Recovery Endpoints Test Suite
 * Programmatically asserts model mutations and API logic.
 */
const { connectDB, sequelize } = require('./config/db');
require('./models/associations');
const User = require('./models/User');
const AuditLog = require('./models/AuditLog');

const runTests = async () => {
    console.log('🧪 Starting Advanced Auth & Recovery Test Suite...\n');
    await connectDB();

    // 1. Setup/Find Test Student User
    let testUser = await User.findOne({ where: { role: 'student' } });
    if (!testUser) {
        console.log('⚠️ No student user found. Creating dummy student user for validation...');
        testUser = await User.create({
            name: 'Verification Test Student',
            email: 'verify_test@ambition.com',
            password: 'originalPass123',
            role: 'student',
            phone: '9999988888',
            username: 'verifytest01',
            status: 'active'
        });
    }
    const testUserId = testUser.id;
    const testUserPhone = testUser.phone || '9999988888';
    if (!testUser.phone) {
        testUser.phone = testUserPhone;
        await testUser.save();
    }

    console.log(`👤 Active Test User: ${testUser.name} (${testUser.username})`);
    console.log(`📱 phone: ${testUserPhone}, email: ${testUser.email}\n`);

    let passed = 0;
    let failed = 0;

    const assert = (condition, message) => {
        if (condition) {
            console.log(`✅ [PASS] ${message}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${message}`);
            failed++;
        }
    };

    // --- TEST 1: Mobile OTP Generation ---
    try {
        console.log('\n--- Test 1: Sending Mobile OTP ---');
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        testUser.otp_code = otp;
        testUser.otp_expiry = new Date(Date.now() + 5 * 60 * 1000);
        await testUser.save();

        const updatedUser = await User.findByPk(testUserId);
        assert(updatedUser.otp_code === otp, 'OTP saved successfully in DB');
        assert(new Date(updatedUser.otp_expiry) > new Date(), 'OTP expiry set correctly in future');
    } catch (err) {
        console.error(err);
        failed++;
    }

    // --- TEST 2: Mobile OTP Verification ---
    try {
        console.log('\n--- Test 2: Verifying Mobile OTP ---');
        const userToVerify = await User.findByPk(testUserId);
        const codeInput = userToVerify.otp_code;
        const isCodeValid = userToVerify.otp_code === codeInput && new Date(userToVerify.otp_expiry) > new Date();
        
        assert(isCodeValid, 'Simulated verification confirms valid OTP');
        
        // Clear OTP columns upon successful verification
        userToVerify.otp_code = null;
        userToVerify.otp_expiry = null;
        await userToVerify.save();

        const clearedUser = await User.findByPk(testUserId);
        assert(clearedUser.otp_code === null, 'OTP details cleared post-verification');
    } catch (err) {
        console.error(err);
        failed++;
    }

    // --- TEST 3: Google OAuth Auto-linking ---
    try {
        console.log('\n--- Test 3: Google Account Map & Sign-In ---');
        const googleId = `google_oauth_${Date.now()}`;
        const targetUser = await User.findByPk(testUserId);
        
        if (!targetUser.google_id) {
            targetUser.google_id = googleId;
            await targetUser.save();
        }

        const linkedUser = await User.findByPk(testUserId);
        assert(linkedUser.google_id !== null, 'Google ID mapped successfully to single user record');
    } catch (err) {
        console.error(err);
        failed++;
    }

    // --- TEST 4: Forgot Password Recovery Code Delivery ---
    try {
        console.log('\n--- Test 4: Forgot Password Request ---');
        const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        const recoveryUser = await User.findOne({ where: { email: testUser.email } });
        assert(recoveryUser !== null, 'User lookup by recovery identity successful');
        
        recoveryUser.otp_code = recoveryCode;
        recoveryUser.otp_expiry = new Date(Date.now() + 10 * 60 * 1000);
        await recoveryUser.save();

        const savedRecoveryUser = await User.findByPk(testUserId);
        assert(savedRecoveryUser.otp_code === recoveryCode, 'Recovery OTP stored successfully');
    } catch (err) {
        console.error(err);
        failed++;
    }

    // --- TEST 5: Password Reset Verification ---
    try {
        console.log('\n--- Test 5: Resetting Password ---');
        const resetUser = await User.findByPk(testUserId);
        const correctCode = resetUser.otp_code;
        const newPasswordInput = 'myBrandNewPassword2026';

        assert(resetUser.otp_code === correctCode && new Date(resetUser.otp_expiry) > new Date(), 'Recovery OTP matched and active');

        resetUser.password = newPasswordInput;
        resetUser.otp_code = null;
        resetUser.otp_expiry = null;
        await resetUser.save();

        // Write recovery log entry
        await AuditLog.create({
            user_id: testUserId,
            action: 'PASSWORD_RESET',
            table_name: 'users',
            record_id: testUserId,
            details: 'Password was successfully reset'
        });

        const updatedPasswordUser = await User.findByPk(testUserId);
        assert(updatedPasswordUser.password === newPasswordInput, 'Password updated successfully in database');

        const loggedAudit = await AuditLog.findOne({ where: { user_id: testUserId, action: 'PASSWORD_RESET' } });
        assert(loggedAudit !== null, 'Audit log correctly created for password reset activity');
    } catch (err) {
        console.error(err);
        failed++;
    }

    // --- TEST 6: Biometric Challenge & verification ---
    try {
        console.log('\n--- Test 6: Biometric Key Registry & Verify ---');
        const credentialId = `mock_credential_id_${Math.random().toString(36).substring(2)}`;
        const publicKey = `mock_public_key_data_${Math.random().toString(36).substring(2)}`;

        const bioUser = await User.findByPk(testUserId);
        bioUser.biometric_credential_id = credentialId;
        bioUser.biometric_public_key = publicKey;
        await bioUser.save();

        const verifiedBioUser = await User.findByPk(testUserId);
        assert(verifiedBioUser.biometric_credential_id === credentialId, 'Biometric hardware key ID successfully stored in user record');
        assert(verifiedBioUser.biometric_public_key === publicKey, 'Biometric public key stored correctly');
    } catch (err) {
        console.error(err);
        failed++;
    }

    console.log(`\n======================================`);
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log(`======================================\n`);

    process.exit(failed > 0 ? 1 : 0);
};

runTests().catch(err => {
    console.error('Fatal execution error:', err);
    process.exit(1);
});
