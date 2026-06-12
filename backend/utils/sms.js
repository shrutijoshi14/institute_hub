const sendSMS = async (toPhone, message) => {
    return new Promise((resolve) => {
        // Mock SMS gateway delay
        setTimeout(() => {
            console.log("\n==================================");
            console.log("Mock SMS Sent Successfully");
            console.log(`To: ${toPhone}`);
            console.log(`Message: ${message}`);
            console.log("==================================\n");
            resolve(true);
        }, 500);
    });
};

module.exports = {
    sendSMS
};
