import express from 'express';
import {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// Guard: Every route below requires a valid JWT token
router.use(authenticateToken);

// GET /api/expenses - List all expenses of logged-in user
router.get('/', getExpenses);

// POST /api/expenses - Add a new expense
router.post('/', addExpense);

// PUT /api/expenses/:id - Update an expense by ID
router.put('/:id', updateExpense);

// DELETE /api/expenses/:id - Delete an expense by ID
router.delete('/:id', deleteExpense);

export default router;
