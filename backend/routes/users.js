const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyJWT } = require('../middleware/jwtAuth');

// GET /api/users - Get all users (admin endpoint)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT id, email, first_name, last_name, phone, role, created_at, updated_at
      FROM users 
      ORDER BY created_at DESC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// PUT /api/users/:userId/role - Update user role (admin only)
router.put('/:userId/role', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || (role !== 'admin' && role !== 'customer')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "admin" or "customer"'
      });
    }

    const query = `
      UPDATE users 
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email, first_name, last_name, phone, role, created_at, updated_at
    `;

    const result = await db.query(query, [role, userId]);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result[0],
      message: 'User role updated successfully'
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
});

// GET /api/users/profile - Get authenticated user's profile
router.get('/profile', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT id, email, first_name, last_name, phone, role, created_at
      FROM users 
      WHERE id = ${userId}
    `;

    const result = await db.query(query);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// PUT /api/users/profile - Update authenticated user's profile
router.put('/profile', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { first_name, last_name, phone } = req.body;

    // Build dynamic query based on provided fields
    let updateFields = [];
    if (first_name !== undefined) {
      updateFields.push(`first_name = '${first_name.replace(/'/g, "''")}'`);
    }
    if (last_name !== undefined) {
      updateFields.push(`last_name = '${last_name.replace(/'/g, "''")}'`);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = '${phone.replace(/'/g, "''")}'`);
    }
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ${userId}
      RETURNING id, email, first_name, last_name, phone, role, created_at
    `;

    const result = await db.query(query);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result[0],
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// GET /api/users/:userId - Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT id, email, first_name, last_name, phone, role, created_at
      FROM users 
      WHERE id = ${userId}
    `;

    const result = await db.query(query);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result[0]
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// PUT /api/users/:userId - Update user profile (admin only)
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { first_name, last_name, phone } = req.body;

    // Build dynamic query based on provided fields
    let updateFields = [];
    if (first_name !== undefined) {
      updateFields.push(`first_name = '${first_name.replace(/'/g, "''")}'`);
    }
    if (last_name !== undefined) {
      updateFields.push(`last_name = '${last_name.replace(/'/g, "''")}'`);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = '${phone.replace(/'/g, "''")}'`);
    }
    updateFields.push('updated_at = CURRENT_TIMESTAMP');

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ${userId}
      RETURNING id, email, first_name, last_name, phone, role, created_at
    `;

    const result = await db.query(query);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: result[0],
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

module.exports = router;