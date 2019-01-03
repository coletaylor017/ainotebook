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

// tagSchema.pre('findOneAndDelete', function(next) {
//     // Remove all the assignment docs that reference the removed person.
//     console.log("some pre-delete code is running!");
//     next();
// });

module.exports = mongoose.model("Tag", tagSchema);