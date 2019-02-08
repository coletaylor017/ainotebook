var mongoose = require("mongoose");

//mongoose schema setup
var quoteSchema = new mongoose.Schema({
    body: String,
    Author: String,
    Source: String,
    Index: Number,
    uploader: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

module.exports = mongoose.model("Quote", quoteSchema);