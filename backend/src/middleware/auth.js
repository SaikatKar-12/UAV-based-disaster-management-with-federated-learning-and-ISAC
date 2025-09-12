/**
 * Authentication Middleware (placeholder)
 */

const authenticateToken = (req, res, next) => {
    // Placeholder authentication middleware
    // In production, implement proper JWT verification
    
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    // For demo purposes, accept any token that starts with 'demo_token_'
    if (token.startsWith('demo_token_')) {
        req.user = {
            id: '1',
            username: 'rescue_operator',
            role: 'operator'
        };
        next();
    } else {
        res.status(403).json({ error: 'Invalid token' });
    }
};

const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (req.user.role !== role && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole
};