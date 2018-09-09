var mongoose = require("mongoose");

var ConversationSchema = new mongoose.Schema({
    sender: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    reciever: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
    message: String,
    time: Date
});

module.exports = mongoose.model("Conversation", ConversationSchema);