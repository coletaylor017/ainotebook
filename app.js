//Hi there please contact before copying

var methodOverride = require("method-override"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    express = require("express"),
    request = require("request"),
    moment = require("moment"),
    flash = require("connect-flash"),
    User = require("./models/user"),
    Global = require("./models/global"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    env = process.env.NODE_ENV || 'development';

console.log("environment: ", env);

var entryRoutes = require("./routes/entries"),
    tagRoutes = require("./routes/tags"),
    quoteRoutes = require("./routes/quotes"),
    indexRoutes = require("./routes/index");

var url = process.env.DATABASEURL;
mongoose.connect(url, { useNewUrlParser: true });

var app = express();
app.set("view engine", "ejs");

app.locals.moment = require('moment');

Global.create({
    currentQuote: "5d640d02ca1e1f1050316805"
});

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
app.use("/tags", tagRoutes);
app.use("/quotes", quoteRoutes);

app.listen(process.env.PORT, function () {
    console.log("Server is now running on port " + process.env.PORT);
});
