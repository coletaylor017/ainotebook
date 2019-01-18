// Middleware!

var middlewareObj = {
    isLoggedIn: function(req, res, next) {
        if(req.isAuthenticated()) {
            return next();
        }
        req.flash("success", "Please log in first");
        res.redirect("/login");
    }
};


module.exports = middlewareObj;