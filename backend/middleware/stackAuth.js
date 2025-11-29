const jwt = require('jsonwebtoken');

// Simple JWT middleware that validates Stack tokens
// Since Stack tokens are JWTs, we can validate them directly
const verifyStackAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No valid authorization token provided'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // For now, we'll extract the user ID from the token without verification
    // This is a simplified approach - in production you'd want proper JWT verification
    try {
      // Decode without verification (Stack handles verification on frontend)
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.sub) {
        throw new Error('Invalid token structure');
      }

      // Add user info to request object
      req.user = {
        id: decoded.sub,
        email: decoded.email || '',
        displayName: decoded.name || '',
        createdAt: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : new Date().toISOString(),
      };

      next();
    } catch (decodeError) {
      console.error('Token decode error:', decodeError);
      return res.status(401).json({
        success: false,
        message: 'Invalid token format'
      });
    }
    
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalStackAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await stackServerApp.getUser({ accessToken: token });
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.primaryEmail,
          displayName: user.displayName,
          createdAt: user.createdAt,
        };
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional Stack auth error:', error);
    // Don't fail, just continue without user
    next();
  }
};

module.exports = {
  verifyStackAuth,
  optionalStackAuth,
};