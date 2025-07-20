// In-memory storage for verification codes (in production, use Redis or database)
const verificationCodes = new Map();
/**
 * Generate and store a 6-digit verification code for email
 */
export function generateEmailVerificationCode(email) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    verificationCodes.set(email.toLowerCase(), {
        email: email.toLowerCase(),
        code,
        expiresAt,
        attempts: 0
    });
    return code;
}
/**
 * Verify the email OTP code
 */
export function verifyEmailCode(email, providedCode) {
    const normalizedEmail = email.toLowerCase();
    const storedData = verificationCodes.get(normalizedEmail);
    if (!storedData) {
        return { valid: false, error: "No verification code found for this email" };
    }
    if (new Date() > storedData.expiresAt) {
        verificationCodes.delete(normalizedEmail);
        return { valid: false, error: "Verification code has expired" };
    }
    if (storedData.attempts >= 3) {
        verificationCodes.delete(normalizedEmail);
        return { valid: false, error: "Too many failed attempts" };
    }
    if (storedData.code !== providedCode) {
        storedData.attempts++;
        return { valid: false, error: "Invalid verification code" };
    }
    // Code is valid, remove it
    verificationCodes.delete(normalizedEmail);
    return { valid: true };
}
/**
 * Clear expired verification codes (cleanup function)
 */
export function cleanupExpiredCodes() {
    const now = new Date();
    for (const [email, data] of Array.from(verificationCodes.entries())) {
        if (now > data.expiresAt) {
            verificationCodes.delete(email);
        }
    }
}
// Run cleanup every 5 minutes
setInterval(cleanupExpiredCodes, 5 * 60 * 1000);
