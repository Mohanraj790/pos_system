import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Usernames and password required' });
        }

        // Get user from database
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const user = users[0];

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role,
                storeId: user.store_id
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return user data and token
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                storeId: user.store_id,
                displayName: user.display_name,
                email: user.email,
                imageUrl: user.image_url
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Register (Admin only)
router.post('/register', authenticateToken, async (req, res) => {
    try {
        // Only SUPER_ADMIN can register new users
        if (req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Only administrators can register users' });
        }

        const { username, password, role, storeId, displayName, email, phoneNumber } = req.body;

        if (!username || !password || !role) {
            return res.status(400).json({ error: 'Username, password, and role required' });
        }

        // Check if username already exists
        const [existing] = await db.query(
            'SELECT id FROM users WHERE username = ?',
            [username]
        );

        if (existing.length > 0) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Insert new user
        const [result] = await db.query(
            `INSERT INTO users (username, password_hash, role, store_id, display_name, email, phone_number) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [username, passwordHash, role, storeId || null, displayName || null, email || null, phoneNumber || null]
        );

        res.status(201).json({
            message: 'User created successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, role, store_id, display_name, email, phone_number, image_url FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        res.json({
            id: user.id,
            username: user.username,
            role: user.role,
            storeId: user.store_id,
            displayName: user.display_name,
            email: user.email,
            phoneNumber: user.phone_number,
            imageUrl: user.image_url
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

export default router;
