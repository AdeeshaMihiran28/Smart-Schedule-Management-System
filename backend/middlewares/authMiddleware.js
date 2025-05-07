const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to include role information
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add user information to request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: "Invalid token" });
    }
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = authMiddleware;
