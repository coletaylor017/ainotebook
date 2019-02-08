var mongoose = require("mongoose");

//mongoose schema setup
var quoteSchema = new mongoose.Schema({
    body: String,
    Author: String,
    Source: String,
    uploader: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

module.exports = mongoose.model("Quote", quoteSchema);