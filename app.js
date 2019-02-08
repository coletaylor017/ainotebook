//Hi there please contact before copying

var methodOverride        = require("method-override"),
    bodyParser            = require("body-parser"),
    mongoose              = require("mongoose"),
    express               = require("express"),
    request               = require("request"),
    moment                = require("moment"),
    flash                 = require("connect-flash"),
    User                  = require("./models/user"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose");

var entryRoutes  = require("./routes/entries"),
    tagRoutes    = require("./routes/tags"),
    quoteRoutes  = require("./routes/quotes"),
    indexRoutes  = require("./routes/index");

var url = process.env.DATABASEURL || "mongodb://localhost:27017/writing_blocks";
mongoose.connect(url, {useNewUrlParser: true});
    
var app = express();
app.set("view engine", "ejs");

app.locals.moment = require('moment');

app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
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

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(indexRoutes);
app.use("/entries", entryRoutes);
app.use("/tags", tagRoutes);
app.use("/quotes", quoteRoutes);

app.listen(process.env.PORT, function() {
    console.log("Server is now running");
});
