import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all stores
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [stores] = await db.query(
            `SELECT id, name, owner_name, currency, gst_number, address, 
              upi_primary, upi_secondary, active_upi_type, is_active, 
              logo_url, timezone, global_discount, 
              created_at, updated_at 
       FROM stores 
       ORDER BY created_at DESC`
        );

        res.json(stores.map(store => ({
            id: store.id,
            name: store.name,
            ownerName: store.owner_name,
            currency: store.currency,
            gstNumber: store.gst_number,
            address: store.address,
            primaryUpiId: store.upi_primary,
            secondaryUpiId: store.upi_secondary,
            activeUpiIdType: store.active_upi_type,
            isActive: Boolean(store.is_active),
            logoUrl: store.logo_url,
            timezone: store.timezone,
            globalDiscount: parseFloat(store.global_discount)
        })));
    } catch (error) {
        console.error('Get stores error:', error);
        res.status(500).json({ error: 'Failed to fetch stores' });
    }
});

// Get single store
router.get('/:id', authenticateToken, async (req, res) => {
    try {
                const [stores] = await db.query(
                        `SELECT id, name, owner_name, currency, gst_number, address, 
                            upi_primary, upi_secondary, active_upi_type, is_active, 
                            logo_url, timezone, global_discount 
             FROM stores WHERE id = ?`,
                        [req.params.id]
                );

        if (stores.length === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }

        const store = stores[0];
        res.json({
            id: store.id,
            name: store.name,
            ownerName: store.owner_name,
            currency: store.currency,
            gstNumber: store.gst_number,
            address: store.address,
            primaryUpiId: store.upi_primary,
            secondaryUpiId: store.upi_secondary,
            activeUpiIdType: store.active_upi_type,
            isActive: Boolean(store.is_active),
            logoUrl: store.logo_url,
            timezone: store.timezone,
            globalDiscount: parseFloat(store.global_discount)
        });
    } catch (error) {
        console.error('Get store error:', error);
        res.status(500).json({ error: 'Failed to fetch store' });
    }
});

// Create store (Super Admin only)
router.post('/', authenticateToken, requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const {
            id, name, ownerName, currency, gstNumber, address,
            primaryUpiId, secondaryUpiId, activeUpiIdType, isActive,
            email, mobile, logoUrl, timezone, globalDiscount
        } = req.body;

        if (!name || !ownerName) {
            return res.status(400).json({ error: 'Name and owner name are required' });
        }

        const [result] = await db.query(
            `INSERT INTO stores (id, name, owner_name, currency, gst_number, address, 
                          upi_primary, upi_secondary, active_upi_type, is_active, 
                          logo_url, timezone, global_discount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, name, ownerName, currency || 'INR', gstNumber || null, address || null,
                primaryUpiId || null, secondaryUpiId || null, activeUpiIdType || null,
                isActive !== false, logoUrl || null,
                timezone || 'Asia/Kolkata', globalDiscount || 0
            ]
        );

        // Attempt to create a default STORE_ADMIN user for this store using
        // username = email and password = mobile (both provided in store payload).
        // This should not fail the store creation if user creation fails.
        try {
                if (email && mobile) {
                const username = email;
                const plainPassword = String(mobile);
                const passwordHash = await bcrypt.hash(plainPassword, 10);

                // Only create if username does not already exist
                const [existingUsers] = await db.query(
                    'SELECT id FROM users WHERE username = ?',
                    [username]
                );

                    if (existingUsers.length === 0) {
                    await db.query(
                        `INSERT INTO users (username, password_hash, role, store_id, display_name, email, phone_number) 
                     VALUES (?, ?, 'STORE_ADMIN', ?, ?, ?, ?)`,
                        [username, passwordHash, id, ownerName || null, email, mobile]
                    );
                } else {
                    console.warn(`Default user for store not created: username ${username} already exists`);
                }
            } else {
                console.warn('Default user for store not created: email or mobile missing');
            }
        } catch (userErr) {
            // Log and continue — store was created successfully above.
            console.error('Auto-create store user error:', userErr);
        }

        res.status(201).json({
            message: 'Store created successfully',
            storeId: id
        });
    } catch (error) {
        console.error('Create store error:', error);
        res.status(500).json({ error: 'Failed to create store' });
    }
});

// Update store
router.put('/:id', authenticateToken, requireRole('SUPER_ADMIN', 'STORE_ADMIN'), async (req, res) => {
    try {
        const {
            name, ownerName, currency, gstNumber, address,
            primaryUpiId, secondaryUpiId, activeUpiIdType, isActive,
            email, mobile, logoUrl, timezone, globalDiscount
        } = req.body;

        // Store admins can only update their own store
        if (req.user.role === 'STORE_ADMIN' && req.user.storeId !== req.params.id) {
            return res.status(403).json({ error: 'You can only update your own store' });
        }

        const [result] = await db.query(
            `UPDATE stores SET 
        name = COALESCE(?, name),
        owner_name = COALESCE(?, owner_name),
        currency = COALESCE(?, currency),
        gst_number = ?,
        address = ?,
        upi_primary = ?,
        upi_secondary = ?,
        active_upi_type = ?,
        is_active = COALESCE(?, is_active),
        logo_url = ?,
        timezone = COALESCE(?, timezone),
        global_discount = COALESCE(?, global_discount)
       WHERE id = ?`,
            [
                name, ownerName, currency, gstNumber, address,
                primaryUpiId, secondaryUpiId, activeUpiIdType, isActive,
                logoUrl, timezone, globalDiscount,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }

        // Also propagate certain changes to STORE_ADMIN users for this store.
        // We'll try to update display_name, email, phone_number and username (if email changed and not already taken).
        const warnings = [];
        try {
            const [storeUsers] = await db.query(
                'SELECT id, username FROM users WHERE store_id = ? AND role = ?',
                [req.params.id, 'STORE_ADMIN']
            );

            for (const user of storeUsers) {
                const updates = [];
                const params = [];

                if (ownerName !== undefined) {
                    updates.push('display_name = ?');
                    params.push(ownerName);
                }
                if (email !== undefined) {
                    updates.push('email = ?');
                    params.push(email);
                }
                if (mobile !== undefined) {
                    updates.push('phone_number = ?');
                    params.push(mobile);
                }

                // If email is provided and differs from current username, attempt to update username
                if (email && email !== user.username) {
                    // Ensure no other user already uses this username
                    const [existing] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [email, user.id]);
                    if (existing.length === 0) {
                        updates.push('username = ?');
                        params.push(email);
                    } else {
                        warnings.push(`Could not change username for user ${user.id} to '${email}': already in use`);
                    }
                }

                if (updates.length > 0) {
                    params.push(user.id);
                    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
                }
            }
        } catch (userErr) {
            console.error('Propagate store update to users error:', userErr);
            // Don't fail the main request; just add a warning
            warnings.push('Failed to update associated users.');
        }

        const responsePayload = { message: 'Store updated successfully' };
        if (warnings.length > 0) responsePayload.warnings = warnings;

        res.json(responsePayload);
    } catch (error) {
        console.error('Update store error:', error);
        res.status(500).json({ error: 'Failed to update store' });
    }
});

export default router;
