const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token || token === 'null' || token === 'undefined') {
        console.error('Auth middleware: No token provided');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded.user) {
            console.error('Auth middleware: Invalid token payload');
            return res.status(401).json({ message: 'Token payload invalid' });
        }

        req.user = decoded.user;
        
        // Ensure both id and _id are set for compatibility
        if (req.user.id && !req.user._id) req.user._id = req.user.id;
        if (req.user._id && !req.user.id) req.user.id = req.user._id;
        
        next();
    } catch (err) {
        console.error('Auth middleware: Token is not valid', err);
        res.status(401).json({ message: 'Token is not valid' });
    }
};
