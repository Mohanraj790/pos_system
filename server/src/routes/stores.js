import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all stores
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [stores] = await db.query(
            `SELECT id, name, owner_name, currency, gst_number, address, 
              upi_primary, upi_secondary, active_upi_type, is_active, 
              email, mobile, logo_url, timezone, global_discount, 
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
            email: store.email,
            mobile: store.mobile,
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
              email, mobile, logo_url, timezone, global_discount 
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
            email: store.email,
            mobile: store.mobile,
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
                          email, mobile, logo_url, timezone, global_discount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, name, ownerName, currency || 'INR', gstNumber || null, address || null,
                primaryUpiId || null, secondaryUpiId || null, activeUpiIdType || null,
                isActive !== false, email || null, mobile || null, logoUrl || null,
                timezone || 'Asia/Kolkata', globalDiscount || 0
            ]
        );

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
        email = ?,
        mobile = ?,
        logo_url = ?,
        timezone = COALESCE(?, timezone),
        global_discount = COALESCE(?, global_discount)
       WHERE id = ?`,
            [
                name, ownerName, currency, gstNumber, address,
                primaryUpiId, secondaryUpiId, activeUpiIdType, isActive,
                email, mobile, logoUrl, timezone, globalDiscount,
                req.params.id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }

        res.json({ message: 'Store updated successfully' });
    } catch (error) {
        console.error('Update store error:', error);
        res.status(500).json({ error: 'Failed to update store' });
    }
});

export default router;
