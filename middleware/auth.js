
exports.requireClient = (req, res, next) => {
    if (!req.session.user || req.session.user.role !== 'client')
        return res.redirect('/auth');
    next();
};

exports.requireAdmin = (req, res, next) => {
    if (!req.session.isAdmin) return res.redirect('/admin/login');
    next();
};
