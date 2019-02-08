// Middleware!

var middlewareObj = {
    isLoggedIn: function(req, res, next) {
        if(req.isAuthenticated()) {
            return next();
        }
        req.flash("error", "Please log in first");
        res.redirect("/login");
    },
    isAdmin: function(req, res, next) {
        if (process.env.ADMINS.includes(req.user.username)) {
            return next();
        }
        console.log("User not authorized --isAdmin middleware");
        req.flash("error","Nice try, but only administrators can do that!");
        res.redirect("/home");
    }
};


module.exports = middlewareObj;