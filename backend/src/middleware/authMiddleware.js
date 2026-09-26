import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate requests using JSON Web Tokens (JWT)
 * Expects header format: Authorization: Bearer <token>
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Extract token from "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token missing or invalid format' });
  }

  const secret = process.env.JWT_SECRET || 'moneytrack_dev_jwt_secret_key_2026';

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token is invalid or has expired' });
    }

    // Attach decoded user information (e.g. id, email) to the request object
    req.user = user;
    next();
  });
};
