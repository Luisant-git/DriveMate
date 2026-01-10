export const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, error: 'User not logged in' });
  }
  
  req.user = {
    id: req.session.userId,
    role: req.session.role
  };
  
  next();
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.role || !roles.includes(req.session.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
};