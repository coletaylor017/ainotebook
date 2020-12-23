var methodOverride = require("method-override"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    express = require("express"),
    flash = require("connect-flash"),
    User = require("./models/user"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    env = process.env.NODE_ENV || 'development';

console.log("environment: ", env);

var entryRoutes = require("./routes/entries"),
    quoteRoutes = require("./routes/quotes"),
    indexRoutes = require("./routes/index");

var url = process.env.DATABASE_URL;
mongoose.connect(url, { useNewUrlParser: true });

var app = express();
app.set("view engine", "ejs");

app.locals.moment = require('moment');

// From arcseldon on https://stackoverflow.com/questions/7185074/heroku-nodejs-http-to-https-ssl-forced-redirect

var forceSsl = function (req, res, next) {
    console.log("running forceSsl");
    if (req.headers['x-forwarded-proto'] !== 'https') {
        console.log("The header is not https");
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    console.log("the header is https");
    return next();
};

if (env === 'production') {
    console.log("Trying to force SSL");
    app.use(forceSsl);
}

app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(flash());

app.use(require("express-session")({
    secret: "I sawed this boat in half!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/scripts', express.static(__dirname + '/node_modules/@yaireo/tagify/'));

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(indexRoutes);
app.use("/entries", entryRoutes);
app.use("/quotes", quoteRoutes);

app.listen(process.env.PORT, function () {
    console.log("Server is now running on port " + process.env.PORT);
});
