function checkRole(roles) {

    return function(req, res, next) {

        if (!req.isAuthenticated()) {

            return res.redirect("/login");
        }

        if (!roles.includes(req.user.role)) {

            return res.send("Access Denied");
        }

        next();
    };
}

module.exports = checkRole;