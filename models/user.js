var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
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
    settings: {
        emails: {
            type: Boolean,
            default: 0
        },
        emailHour: String,
        emailMinute: String,
        theme: {
            type: String,
            default: "default"
        }
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);