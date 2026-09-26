import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';

// Secret key for signing tokens
const JWT_SECRET = process.env.JWT_SECRET || 'moneytrack_dev_jwt_secret_key_2026';

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Helper function: Find user by email in the SQLite database
 */
const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

/**
 * Helper function: Insert a new user into SQLite database
 */
const createUser = (name, email, hashedPassword) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, name, email });
      }
    );
  });
};

/**
 * Controller: Register a new user
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    // 1. Validate name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Please provide a valid name.' });
    }

    // 2. Validate email
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Please provide an email address.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address format.' });
    }

    // 3. Validate password
    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // 4. Check if user already exists
    const existingUser = await findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    // 5. Hash password using bcryptjs
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 6. Save user into the database
    const newUser = await createUser(name.trim(), normalizedEmail, hashedPassword);

    // 7. Generate a JWT token for immediate login
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 8. Return response (excluding the password hash)
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

/**
 * Controller: Log in an existing user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    // 1. Validate inputs
    if (!email || typeof email !== 'string' || !email.trim() || !password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Find user by email
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      // Use generic message to prevent email enumeration
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 3. Compare submitted password with stored hashed password
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 4. Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Return user data and token
    return res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
};
