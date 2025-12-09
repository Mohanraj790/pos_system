import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all categories (optionally filtered by store)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { storeId } = req.query;

        let query = `SELECT id, store_id, name, default_gst, default_discount, low_stock_threshold 
                 FROM categories`;
        let params = [];

        if (storeId) {
            query += ' WHERE store_id = ?';
            params.push(storeId);
        }

        query += ' ORDER BY name ASC';

        const [categories] = await db.query(query, params);

        res.json(categories.map(cat => ({
            id: cat.id,
            storeId: cat.store_id,
            name: cat.name,
            defaultGST: parseFloat(cat.default_gst),
            defaultDiscount: parseFloat(cat.default_discount),
            lowStockThreshold: cat.low_stock_threshold
        })));
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// Create category
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { id, storeId, name, defaultGST, defaultDiscount, lowStockThreshold } = req.body;

        if (!storeId || !name) {
            return res.status(400).json({ error: 'Store ID and name are required' });
        }

        // Verify store exists
        const [stores] = await db.query('SELECT id FROM stores WHERE id = ?', [storeId]);
        if (stores.length === 0) {
            return res.status(404).json({ error: 'Store not found' });
        }

        await db.query(
            `INSERT INTO categories (id, store_id, name, default_gst, default_discount, low_stock_threshold) 
       VALUES (?, ?, ?, ?, ?, ?)`,
            [id, storeId, name, defaultGST || 0, defaultDiscount || 0, lowStockThreshold || 10]
        );

        res.status(201).json({
            message: 'Category created successfully',
            categoryId: id
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// Update category
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { name, defaultGST, defaultDiscount, lowStockThreshold } = req.body;

        const [result] = await db.query(
            `UPDATE categories SET 
        name = COALESCE(?, name),
        default_gst = COALESCE(?, default_gst),
        default_discount = COALESCE(?, default_discount),
        low_stock_threshold = COALESCE(?, low_stock_threshold)
       WHERE id = ?`,
            [name, defaultGST, defaultDiscount, lowStockThreshold, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category updated successfully' });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Delete category
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        // Check if category has products
        const [products] = await db.query(
            'SELECT id FROM products WHERE category_id = ? LIMIT 1',
            [req.params.id]
        );

        if (products.length > 0) {
            return res.status(409).json({
                error: 'Cannot delete category with existing products'
            });
        }

        const [result] = await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

export default router;
