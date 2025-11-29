const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = neon(process.env.DATABASE_URL);

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    console.log('Register request received, body:', req.body);
    const { email, password, first_name, last_name, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;
    
    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = await sql`
      INSERT INTO users (email, password_hash, first_name, last_name, phone, role, email_verified)
      VALUES (${email}, ${hashedPassword}, ${first_name}, ${last_name}, ${phone}, 'customer', true)
      RETURNING id, email, first_name, last_name, phone, role, email_verified, created_at
    `;

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser[0].id.toString(),
          email: newUser[0].email,
          first_name: newUser[0].first_name,
          last_name: newUser[0].last_name,
          phone: newUser[0].phone,
          role: newUser[0].role,
          email_verified: newUser[0].email_verified,
          created_at: newUser[0].created_at
        }
      },
      message: 'User registered successfully!'
    });

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register user'
    });
  }
});

// POST /api/auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    console.log('Login request received, body:', req.body);
    const { email, password } = req.body;
    console.log('Extracted email:', email, 'password:', password ? '[REDACTED]' : 'undefined');

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user
    const user = await sql`
      SELECT id, email, password_hash, first_name, last_name, phone, role, email_verified, created_at
      FROM users 
      WHERE email = ${email}
    `;
    
    if (user.length === 0) {
      console.log('User not found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user[0].password_hash);
    console.log('Password validation result:', isValidPassword);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user[0].email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        requiresVerification: true
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user[0].id, email: user[0].email, role: user[0].role },
      process.env.JWT_SECRET || 'temp-secret-key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? undefined : undefined, // Allow localhost
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user[0].id.toString(),
          email: user[0].email,
          first_name: user[0].first_name,
          last_name: user[0].last_name,
          phone: user[0].phone,
          role: user[0].role,
          created_at: user[0].created_at
        }
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to login'
    });
  }
});

// POST /api/auth/logout - Logout user
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// GET /api/auth/me - Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'temp-secret-key');
    
    // Get user from database
    const user = await sql`
      SELECT id, email, first_name, last_name, phone, role, created_at
      FROM users 
      WHERE id = ${decoded.userId}
    `;
    
    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user[0].id.toString(),
          email: user[0].email,
          first_name: user[0].first_name,
          last_name: user[0].last_name,
          phone: user[0].phone,
          role: user[0].role,
          created_at: user[0].created_at
        }
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    console.error('Error getting current user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user information'
    });
  }
});

module.exports = router;