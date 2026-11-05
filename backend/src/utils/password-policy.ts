/**
 * WayRivo AI Password Policy & Security Verification
 * Implements modern NIST SP 800-63B guidelines:
 * - Minimum 12 characters, Maximum 128 characters
 * - No arbitrary symbol/digit complexity enforcement that leads to predictable substitutions
 * - Rejection of common compromised/blocklisted passwords
 * - No truncation of submitted passwords
 */

const COMPROMISED_PASSWORD_BLOCKLIST = new Set([
  'password123456',
  'password12345',
  '123456789012',
  'qwerty123456',
  'administrator123',
  'wayrivopassword',
  'welcome123456',
  'changeme123456',
  'iloveyou123456',
  'letmein123456',
  'trustnoone1234',
  'secretpassword1',
  'monkey12345678',
  'dragon12345678',
  'master12345678',
  'shadow12345678',
  'football12345',
  'baseball12345',
  'superman12345',
  'starwars12345',
]);

export function validatePasswordStrength(password: string): { isValid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 12) {
    return {
      isValid: false,
      error: 'Password must be at least 12 characters long according to security standards.',
    };
  }

  if (password.length > 128) {
    return {
      isValid: false,
      error: 'Password cannot exceed 128 characters.',
    };
  }

  const normalized = password.toLowerCase().trim();
  if (COMPROMISED_PASSWORD_BLOCKLIST.has(normalized)) {
    return {
      isValid: false,
      error: 'This password is too commonly used or has appeared in known data breaches. Please choose a more unique phrase or passphrase.',
    };
  }

  return { isValid: true };
}

