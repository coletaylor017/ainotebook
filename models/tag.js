var mongoose = require("mongoose");

//mongoose schema setup
var tagSchema = new mongoose.Schema({
    name: String,
    user: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    entries: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Entry"
        }
    ]
});

module.exports = mongoose.model("Tag", tagSchema);