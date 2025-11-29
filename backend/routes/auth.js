const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Temporary in-memory user storage for testing
const users = [
  {
    id: 1,
    email: 'test@example.com',
    password_hash: '$2a$12$85gAJp/adMTRTEyYyHXVz.TELlaWNURew/u8lbFRyP..Y6kAiaSYi', // "test123"
    first_name: 'Test',
    last_name: 'User',
    role: 'customer',
    email_verified: true
  },
  {
    id: 2,
    email: 'admin@example.com',
    password_hash: '$2a$12$85gAJp/adMTRTEyYyHXVz.TELlaWNURew/u8lbFRyP..Y6kAiaSYi', // "test123"
    first_name: 'Admin',
    last_name: 'User',
    role: 'admin',
    email_verified: true
  },
  {
    id: 3,
    email: 'carlitosdiazplaza@gmail.com',
    password_hash: '$2a$12$ETSj/w3t/l7eupsfn0WJcuMSssaRjlRqOM3NJuqEpucq4fY6iIAqq', // "Carlitos#1"
    first_name: 'Carlos',
    last_name: 'Diaz Plaza',
    role: 'admin',
    email_verified: true
  }
];

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
      id: users.length + 1,
      email,
      password_hash: hashedPassword,
      first_name,
      last_name,
      phone,
      role: 'customer',
      email_verified: true
    };

    users.push(newUser);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          phone: newUser.phone,
          role: newUser.role,
          email_verified: newUser.email_verified
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
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        requiresVerification: true
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
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
          id: user.id.toString(), // Frontend expects string
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          role: user.role,
          created_at: new Date().toISOString() // Frontend expects this field
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
    
    // Get user
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id.toString(), // Frontend expects string
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          role: user.role,
          created_at: new Date().toISOString() // Frontend expects this field
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