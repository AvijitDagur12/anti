/**
 * MoneyTrack API Service
 * Centralized HTTP client using the native Fetch API
 */

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Token management helpers using browser localStorage
 */
export const getToken = () => localStorage.getItem('moneytrack_token');
export const setToken = (token) => localStorage.setItem('moneytrack_token', token);
export const removeToken = () => localStorage.removeItem('moneytrack_token');

/**
 * Central request wrapper
 * - Automatically attaches Content-Type and Authorization headers
 * - Parses JSON responses
 * - Throws descriptive errors when HTTP status is not 2xx
 */
async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // If a JWT token exists in localStorage, attach it to Authorization header
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || `HTTP error ${response.status}`;
    throw new Error(message);
  }

  return data;
}

/**
 * Authentication API calls
 */
export const authApi = {
  // Register new account: POST /api/auth/register
  register: (name, email, password) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  // Login to existing account: POST /api/auth/login
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

/**
 * Expense CRUD API calls
 */
export const expenseApi = {
  // Retrieve user's expenses: GET /api/expenses
  getAll: () =>
    request('/expenses', {
      method: 'GET',
    }),

  // Add new expense: POST /api/expenses
  create: (expenseData) =>
    request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    }),

  // Update existing expense: PUT /api/expenses/:id
  update: (id, expenseData) =>
    request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expenseData),
    }),

  // Delete expense: DELETE /api/expenses/:id
  delete: (id) =>
    request(`/expenses/${id}`, {
      method: 'DELETE',
    }),
};

export default {
  auth: authApi,
  expenses: expenseApi,
  getToken,
  setToken,
  removeToken,
};
