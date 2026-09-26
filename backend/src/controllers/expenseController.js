import db from '../db/database.js';

/**
 * Helper: Retrieve all expenses belonging to a specific user
 */
const fetchUserExpenses = (userId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC',
      [userId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });
};

/**
 * Helper: Find a specific expense by ID ensuring it belongs to the user
 */
const findUserExpenseById = (id, userId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

/**
 * Helper: Insert a new expense into SQLite
 */
const insertExpense = (userId, title, amount, category, date) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO expenses (user_id, title, amount, category, date) VALUES (?, ?, ?, ?, ?)',
      [userId, title, amount, category, date],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, user_id: userId, title, amount, category, date, created_at: new Date().toISOString() });
      }
    );
  });
};

/**
 * Helper: Update an existing expense in SQLite
 */
const modifyExpense = (id, userId, title, amount, category, date) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE expenses SET title = ?, amount = ?, category = ?, date = ? WHERE id = ? AND user_id = ?',
      [title, amount, category, date, id, userId],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

/**
 * Helper: Delete an expense from SQLite
 */
const removeExpense = (id, userId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId],
      function (err) {
        if (err) reject(err);
        else resolve(this.changes);
      }
    );
  });
};

/**
 * GET /api/expenses
 * Retrieve all expenses for the authenticated user
 */
export const getExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenses = await fetchUserExpenses(userId);
    return res.status(200).json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return res.status(500).json({ error: 'Failed to retrieve expenses.' });
  }
};

/**
 * POST /api/expenses
 * Create a new expense for the authenticated user
 */
export const addExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, amount, category, date } = req.body || {};

    // 1. Validate title
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Please provide a valid title.' });
    }

    // 2. Validate amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Please provide a positive numeric amount.' });
    }

    // 3. Validate category
    if (!category || typeof category !== 'string' || !category.trim()) {
      return res.status(400).json({ error: 'Please provide a category.' });
    }

    // 4. Validate or default date (YYYY-MM-DD)
    const expenseDate = date && typeof date === 'string' && date.trim()
      ? date.trim()
      : new Date().toISOString().split('T')[0];

    // 5. Insert expense
    const newExpense = await insertExpense(
      userId,
      title.trim(),
      parsedAmount,
      category.trim(),
      expenseDate
    );

    return res.status(201).json({
      message: 'Expense created successfully',
      expense: newExpense
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    return res.status(500).json({ error: 'Failed to create expense.' });
  }
};

/**
 * PUT /api/expenses/:id
 * Update an existing expense (ensures user owns the expense)
 */
export const updateExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = parseInt(req.params.id, 10);

    if (isNaN(expenseId)) {
      return res.status(400).json({ error: 'Invalid expense ID parameter.' });
    }

    // 1. Verify existence and ownership
    const existingExpense = await findUserExpenseById(expenseId, userId);
    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found or unauthorized.' });
    }

    const { title, amount, category, date } = req.body || {};

    // 2. Validate inputs or fallback to existing values
    const updatedTitle = title !== undefined ? String(title).trim() : existingExpense.title;
    if (!updatedTitle) {
      return res.status(400).json({ error: 'Title cannot be empty.' });
    }

    let updatedAmount = existingExpense.amount;
    if (amount !== undefined) {
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number.' });
      }
      updatedAmount = parsed;
    }

    const updatedCategory = category !== undefined ? String(category).trim() : existingExpense.category;
    if (!updatedCategory) {
      return res.status(400).json({ error: 'Category cannot be empty.' });
    }

    const updatedDate = date !== undefined && String(date).trim()
      ? String(date).trim()
      : existingExpense.date;

    // 3. Persist update in SQLite
    await modifyExpense(expenseId, userId, updatedTitle, updatedAmount, updatedCategory, updatedDate);

    return res.status(200).json({
      message: 'Expense updated successfully',
      expense: {
        id: expenseId,
        user_id: userId,
        title: updatedTitle,
        amount: updatedAmount,
        category: updatedCategory,
        date: updatedDate,
        created_at: existingExpense.created_at
      }
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    return res.status(500).json({ error: 'Failed to update expense.' });
  }
};

/**
 * DELETE /api/expenses/:id
 * Delete an expense (ensures user owns the expense)
 */
export const deleteExpense = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenseId = parseInt(req.params.id, 10);

    if (isNaN(expenseId)) {
      return res.status(400).json({ error: 'Invalid expense ID parameter.' });
    }

    // 1. Verify existence and ownership
    const existingExpense = await findUserExpenseById(expenseId, userId);
    if (!existingExpense) {
      return res.status(404).json({ error: 'Expense not found or unauthorized.' });
    }

    // 2. Delete the record
    await removeExpense(expenseId, userId);

    return res.status(200).json({ message: 'Expense deleted successfully.' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return res.status(500).json({ error: 'Failed to delete expense.' });
  }
};
