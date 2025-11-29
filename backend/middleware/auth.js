const { verifyJWT } = require('./jwtAuth');

// Simple alias to jwtAuth middleware for compatibility
module.exports = verifyJWT;