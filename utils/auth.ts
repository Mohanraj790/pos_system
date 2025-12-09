import bcrypt from 'bcryptjs';

/**
 * Authentication Utilities
 * Handles password hashing and verification for user authentication
 */

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate a hashed password synchronously (for seed data)
 * @param password - Plain text password
 * @returns Hashed password
 */
export function hashPasswordSync(password: string): string {
    return bcrypt.hashSync(password, SALT_ROUNDS);
}

/**
 * Verify a password synchronously
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns True if password matches, false otherwise
 */
export function verifyPasswordSync(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
}
