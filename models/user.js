var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: String,
    password: String,
    dateCreated: {type: Date, default: Date.now},
    entries: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Entry"
        }
    ]
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);