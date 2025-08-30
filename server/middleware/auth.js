const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token || token === 'null' || token === 'undefined') {
        console.error('Auth middleware: No token provided');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Handle both token structures: { user: {...} } and { id, role }
        let userData;
        if (decoded.user) {
            // Token with user wrapper (from user registration)
            userData = decoded.user;
        } else if (decoded.id && decoded.role) {
            // Token without user wrapper (from admin login)
            userData = decoded;
        } else {
            console.error('Auth middleware: Invalid token payload structure');
            return res.status(401).json({ message: 'Token payload invalid' });
        }

        req.user = userData;
        
        // Ensure both id and _id are set for compatibility
        if (req.user.id && !req.user._id) req.user._id = req.user.id;
        if (req.user._id && !req.user.id) req.user.id = req.user._id;
        
        console.log('🔐 Auth middleware: User authenticated:', { id: req.user.id, role: req.user.role });
        next();
    } catch (err) {
        console.error('Auth middleware: Token is not valid', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};
