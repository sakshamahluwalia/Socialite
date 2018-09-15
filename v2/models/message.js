var mongoose = require("mongoose");

var MessageSchema = new mongoose.Schema({
    sender: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    reciever: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    body: String,
    time: Date
});

module.exports = mongoose.model("Conversation", MessageSchema);