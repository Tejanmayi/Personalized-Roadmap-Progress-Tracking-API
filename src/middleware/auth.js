const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Please authenticate.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('JWT verification error:', error);
      return res.status(401).json({ message: 'Please authenticate.' });
    }

    const userId = decoded.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Please authenticate.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Please authenticate.' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Please authenticate.' });
  }
};

module.exports = auth; 