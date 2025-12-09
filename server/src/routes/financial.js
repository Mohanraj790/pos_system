import express from 'express';
import db from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get financial overview for a store (optionally date range)
router.get('/overview/:storeId', authenticateToken, async (req, res) => {
    try {
        const { storeId } = req.params;
        const { from, to } = req.query;

        if ((req.user.role === 'STORE_ADMIN' || req.user.role === 'CASHIER') && req.user.storeId !== storeId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Build date filter
        let dateFilter = '';
        let dateParams = [];
        if (from || to) {
            dateFilter = 'WHERE ';
            if (from) {
                dateFilter += 'date >= ?';
                dateParams.push(from);
            }
            if (to) {
                if (from) dateFilter += ' AND ';
                dateFilter += 'date <= ?';
                dateParams.push(to);
            }
        }

        // Total Investment (from partnerships)
        const [investmentRows] = await db.query(
            `SELECT COALESCE(SUM(p.cash_investment + COALESCE(pa.total_asset_value, 0)), 0) as total_investment
             FROM partnerships p
             LEFT JOIN (
                 SELECT partnership_id, SUM(asset_value) as total_asset_value
                 FROM partnership_assets
                 GROUP BY partnership_id
             ) pa ON p.id = pa.partnership_id
             WHERE p.store_id = ? AND p.is_active = TRUE`,
            [storeId]
        );
        const totalInvestment = parseFloat(investmentRows[0].total_investment || 0);

        // Total Sales (from invoices)
        let salesQuery = `SELECT COALESCE(SUM(grand_total), 0) as total_sales FROM invoices WHERE store_id = ?`;
        let salesParams = [storeId];
        if (dateFilter) {
            salesQuery += ' AND ' + dateFilter.replace('WHERE ', '');
            salesParams = salesParams.concat(dateParams);
        }
        const [salesRows] = await db.query(salesQuery, salesParams);
        const totalSales = parseFloat(salesRows[0].total_sales || 0);

        // Total Expenses
        let expenseQuery = `SELECT COALESCE(SUM(amount), 0) as total_expenses FROM expenses WHERE store_id = ?`;
        let expenseParams = [storeId];
        if (dateFilter) {
            expenseQuery += ' AND ' + dateFilter.replace('expense_date', 'expense_date').replace('WHERE ', '');
            expenseParams = expenseParams.concat(dateParams);
        }
        const [expenseRows] = await db.query(expenseQuery, expenseParams);
        const totalExpenses = parseFloat(expenseRows[0].total_expenses || 0);

        // Profit calculation
        const profit = totalSales - totalExpenses;

        // Additional metrics
        const [invoiceCountRows] = await db.query(
            `SELECT COUNT(*) as invoice_count FROM invoices WHERE store_id = ? ${dateFilter ? 'AND ' + dateFilter.replace('WHERE ', '') : ''}`,
            dateFilter ? [storeId, ...dateParams] : [storeId]
        );
        const invoiceCount = parseInt(invoiceCountRows[0].invoice_count || 0);

        const [expenseCountRows] = await db.query(
            `SELECT COUNT(*) as expense_count FROM expenses WHERE store_id = ? ${dateFilter ? 'AND ' + dateFilter.replace('WHERE ', '').replace('date', 'expense_date') : ''}`,
            dateFilter ? [storeId, ...dateParams] : [storeId]
        );
        const expenseCount = parseInt(expenseCountRows[0].expense_count || 0);

        res.json({
            storeId,
            period: { from, to },
            summary: {
                totalInvestment,
                totalSales,
                totalExpenses,
                profit,
                profitMargin: totalSales > 0 ? (profit / totalSales) * 100 : 0
            },
            counts: {
                invoices: invoiceCount,
                expenses: expenseCount
            },
            currency: 'INR' // You might want to fetch this from store settings
        });
    } catch (error) {
        console.error('Get financial overview error:', error);
        res.status(500).json({ error: 'Failed to fetch financial overview' });
    }
});

export default router;
