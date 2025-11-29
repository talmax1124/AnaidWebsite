const jwt = require('jsonwebtoken');

// JWT middleware that validates our auth tokens
const verifyJWT = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.auth_token;
    
    if (!token) {
      // Also check Authorization header as fallback
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const headerToken = authHeader.substring(7);
        return verifyToken(headerToken, req, res, next);
      }
      
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    return verifyToken(token, req, res, next);
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

const verifyToken = async (token, req, res, next) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user info to request object
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalJWT = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };
      } catch (error) {
        // Ignore token errors in optional auth
        console.log('Optional auth token invalid:', error.message);
      }
    }
    
    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

module.exports = {
  verifyJWT,
  optionalJWT
};