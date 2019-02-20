var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    dateCreated: {
        type: Date,
        default: Date.now
    },
    streak: {
        type: Number,
        default: 0
    },
    lastEntry: [],
    badges: [],
    entries: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Entry"
        }
    ],
    isAdmin: {
        type: Boolean,
        default: 0
    },
    timezone: {
        type: Number,
        default: 0
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);