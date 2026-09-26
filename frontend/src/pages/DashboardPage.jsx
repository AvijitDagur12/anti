import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { expenseApi } from '../services/api.js';

const CATEGORIES = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Utilities & Bills',
  'Entertainment',
  'Health',
  'Housing',
  'Other',
];

export default function DashboardPage() {
  const { user, logout } = useAuth();

  // State
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Add Expense form state
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food & Dining',
    date: today,
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Expense modal state
  const [editingExpense, setEditingExpense] = useState(null);
  const [editError, setEditError] = useState('');
  const [updating, setUpdating] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDate, setFilterDate] = useState('');

  // 1. Fetch expenses on initial load
  const loadExpenses = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const data = await expenseApi.getAll();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  // 2. Handle Add Expense Form Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const { title, amount, category, date } = formData;

    if (!title.trim()) {
      setFormError('Please enter an expense title.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid positive amount.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await expenseApi.create({
        title: title.trim(),
        amount: parsedAmount,
        category,
        date: date || today,
      });

      // Optimistically add to top of list
      setExpenses((prev) => [result.expense, ...prev]);

      // Reset form
      setFormData({
        title: '',
        amount: '',
        category: 'Food & Dining',
        date: today,
      });
    } catch (err) {
      setFormError(err.message || 'Failed to create expense');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Handle Delete Expense
  const handleDelete = async (id, title) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${title}"?`);
    if (!confirmed) return;

    try {
      await expenseApi.delete(id);
      // Remove from state
      setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    } catch (err) {
      alert(`Error deleting expense: ${err.message}`);
    }
  };

  // 4. Handle Edit Expense Submit
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setEditError('');

    const { id, title, amount, category, date } = editingExpense;

    if (!title.trim()) {
      setEditError('Title cannot be empty.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setEditError('Please enter a valid positive amount.');
      return;
    }

    setUpdating(true);
    try {
      const result = await expenseApi.update(id, {
        title: title.trim(),
        amount: parsedAmount,
        category,
        date,
      });

      // Update state with updated expense
      setExpenses((prev) =>
        prev.map((exp) => (exp.id === id ? result.expense : exp))
      );

      // Close modal
      setEditingExpense(null);
    } catch (err) {
      setEditError(err.message || 'Failed to update expense');
    } finally {
      setUpdating(false);
    }
  };

  // Calculations for Summary
  const totalExpenses = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const totalSpentThisMonth = expenses
    .filter((item) => item.date && item.date.startsWith(currentYearMonth))
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Filtered Expenses derived state
  const filteredExpenses = expenses.filter((item) => {
    // 1. Search by title (case-insensitive)
    const matchesSearch = item.title
      ? item.title.toLowerCase().includes(searchQuery.trim().toLowerCase())
      : true;

    // 2. Filter by category
    const matchesCategory =
      filterCategory === 'All' || item.category === filterCategory;

    // 3. Filter by date (prefix or exact match)
    const matchesDate = !filterDate || (item.date && item.date.startsWith(filterDate));

    return matchesSearch && matchesCategory && matchesDate;
  });

  const hasActiveFilters =
    searchQuery.trim() !== '' || filterCategory !== 'All' || filterDate !== '';

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterCategory('All');
    setFilterDate('');
  };

  return (
    <div className="dashboard-container">
      {/* Top Navigation Bar */}
      <header className="dashboard-nav">
        <div className="nav-brand">
          <h1>
            Money<span>Track</span>
          </h1>
          <span className="brand-tag">Expense Tracker</span>
        </div>

        <div className="nav-user">
          <div className="user-greeting">
            <span className="welcome-label">Welcome back,</span>
            <span className="user-name">{user?.name}</span>
          </div>
          <button onClick={logout} className="btn btn-secondary btn-sm">
            Sign Out
          </button>
        </div>
      </header>

      {/* Summary KPI Banner */}
      <section className="summary-banner">
        <div className="summary-card">
          <span className="summary-label">Total Expenses</span>
          <span className="summary-value">${totalExpenses.toFixed(2)}</span>
          <span className="summary-subtext">All-time cumulative spending</span>
        </div>

        <div className="summary-card">
          <span className="summary-label">Total Spent This Month</span>
          <span className="summary-value">${totalSpentThisMonth.toFixed(2)}</span>
          <span className="summary-subtext">{currentMonthName}</span>
        </div>
      </section>

      {/* Main Grid: Add Expense Form & Expenses Table */}
      <main className="dashboard-grid">
        {/* Left Column: Add Expense Form */}
        <section className="dashboard-card add-card">
          <div className="card-header">
            <h3>Add New Expense</h3>
            <p>Log a transaction to keep your records up to date</p>
          </div>

          {formError && (
            <div className="alert alert-error">
              <span>⚠️ {formError}</span>
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="add-form" noValidate>
            <div className="form-group">
              <label htmlFor="title">Description / Title</label>
              <input
                id="title"
                type="text"
                placeholder="e.g. Grocery store, Subway ticket"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="amount">Amount ($)</label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={submitting}
            >
              {submitting ? 'Saving Expense...' : '+ Add Expense'}
            </button>
          </form>
        </section>

        {/* Right Column: Expenses Table / List */}
        <section className="dashboard-card list-card">
          <div className="card-header list-header">
            <div className="list-title-group">
              <h3>Your Expenses</h3>
              {expenses.length > 0 && (
                <span className="count-badge">
                  {hasActiveFilters
                    ? `${filteredExpenses.length} of ${expenses.length}`
                    : `${expenses.length}`}
                </span>
              )}
            </div>
            <button
              onClick={loadExpenses}
              className="btn-refresh"
              title="Refresh expenses"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Search & Filter Bar */}
          {expenses.length > 0 && (
            <div className="filter-bar">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="btn-clear-search"
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="filter-controls">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="filter-select"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="filter-date-input"
                  title="Filter by specific date"
                />

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="btn-reset-filters"
                    title="Reset all filters"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}

          {fetchError && (
            <div className="alert alert-error">
              <span>⚠️ {fetchError}</span>
            </div>
          )}

          {loading ? (
            <div className="empty-state">
              <p>Loading your expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">💸</div>
              <h4>No expenses recorded yet</h4>
              <p>Add your first expense using the form to start tracking your budget.</p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔎</div>
              <h4>No matching expenses found</h4>
              <p>No transactions match your current search, category, or date filter.</p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '12px' }}
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="expenses-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th className="text-right">Amount</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="expense-date">{expense.date}</td>
                      <td className="expense-title">{expense.title}</td>
                      <td>
                        <span className="category-badge">
                          {expense.category}
                        </span>
                      </td>
                      <td className="expense-amount text-right">
                        ${Number(expense.amount).toFixed(2)}
                      </td>
                      <td className="expense-actions text-center">
                        <button
                          onClick={() =>
                            setEditingExpense({
                              ...expense,
                              date: expense.date ? expense.date.split('T')[0].split(' ')[0] : today,
                            })
                          }
                          className="action-btn action-edit"
                          title="Edit expense"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id, expense.title)}
                          className="action-btn action-delete"
                          title="Delete expense"
                        >
                          🗑️ Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Edit Expense Modal Dialog */}
      {editingExpense && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Expense</h3>
              <button
                onClick={() => setEditingExpense(null)}
                className="btn-close"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="alert alert-error">
                <span>⚠️ {editError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateSubmit} className="add-form">
              <div className="form-group">
                <label htmlFor="edit-title">Description / Title</label>
                <input
                  id="edit-title"
                  type="text"
                  value={editingExpense.title}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="edit-amount">Amount ($)</label>
                  <input
                    id="edit-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={editingExpense.amount}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, amount: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit-category">Category</label>
                  <select
                    id="edit-category"
                    value={editingExpense.category}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, category: e.target.value })
                    }
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="edit-date">Date</label>
                <input
                  id="edit-date"
                  type="date"
                  value={editingExpense.date}
                  onChange={(e) =>
                    setEditingExpense({ ...editingExpense, date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating}
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
