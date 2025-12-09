import express from 'express';
import db from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get expenses for a store (optionally date range)
router.get('/store/:storeId', authenticateToken, async (req, res) => {
    try {
        const { storeId } = req.params;
        const { from, to } = req.query;

        if ((req.user.role === 'STORE_ADMIN' || req.user.role === 'CASHIER') && req.user.storeId !== storeId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        let query = 'SELECT id, store_id, title, amount, expense_date, category, notes, created_at, updated_at FROM expenses WHERE store_id = ?';
        const params = [storeId];
        if (from) {
            query += ' AND expense_date >= ?';
            params.push(from);
        }
        if (to) {
            query += ' AND expense_date <= ?';
            params.push(to);
        }
        query += ' ORDER BY expense_date DESC';

        const [rows] = await db.query(query, params);
        res.json(rows.map(r => ({
            id: r.id,
            storeId: r.store_id,
            title: r.title,
            amount: parseFloat(r.amount),
            expenseDate: r.expense_date,
            category: r.category,
            notes: r.notes,
            createdAt: r.created_at,
            updatedAt: r.updated_at
        })));
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// Create expense
router.post('/', authenticateToken, requireRole('SUPER_ADMIN','STORE_ADMIN', 'CASHIER'), async (req, res) => {
    try {
        const { storeId, title, amount, expenseDate, category, notes } = req.body;
        if (!storeId || !title || amount === undefined || !expenseDate) {
            return res.status(400).json({ error: 'storeId, title, amount, and expenseDate are required' });
        }

        if ((req.user.role === 'STORE_ADMIN' || req.user.role === 'CASHIER') && req.user.storeId !== storeId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [result] = await db.query(
            `INSERT INTO expenses (id, store_id, title, amount, expense_date, category, notes) VALUES (UUID(), ?, ?, ?, ?, ?, ?)`,
            [storeId, title, amount, expenseDate, category || null, notes || null]
        );

        res.status(201).json({ message: 'Expense recorded', expenseId: result.insertId });
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ error: 'Failed to create expense' });
    }
});

// Update expense
router.put('/:id', authenticateToken, requireRole('SUPER_ADMIN','STORE_ADMIN'), async (req, res) => {
    try {
        const { title, amount, expenseDate, category, notes } = req.body;

        // Check ownership
        const [rows] = await db.query('SELECT store_id FROM expenses WHERE id = ?', [req.params.id]);
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
        const storeId = rows[0].store_id;
        if (req.user.role === 'STORE_ADMIN' && req.user.storeId !== storeId) return res.status(403).json({ error: 'Access denied' });

        const [result] = await db.query(
            `UPDATE expenses SET title = COALESCE(?, title), amount = COALESCE(?, amount), expense_date = COALESCE(?, expense_date), category = ?, notes = ? WHERE id = ?`,
            [title, amount, expenseDate, category || null, notes || null, req.params.id]
        );

        res.json({ message: 'Expense updated' });
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ error: 'Failed to update expense' });
    }
});

// Delete expense
router.delete('/:id', authenticateToken, requireRole('SUPER_ADMIN','STORE_ADMIN', 'CASHIER'), async (req, res) => {
    try {
        const [rows] = await db.query('SELECT store_id FROM expenses WHERE id = ?', [req.params.id]);
        if (!rows || rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
        const storeId = rows[0].store_id;
        if ((req.user.role === 'STORE_ADMIN' || req.user.role === 'CASHIER') && req.user.storeId !== storeId) return res.status(403).json({ error: 'Access denied' });

        await db.query('DELETE FROM expenses WHERE id = ?', [req.params.id]);
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

export default router;
