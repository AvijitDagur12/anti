import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

// Route: Register a new user
// POST /api/auth/register
router.post('/register', register);

// Route: Authenticate and log in user
// POST /api/auth/login
router.post('/login', login);

export default router;
