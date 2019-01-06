var mongoose = require("mongoose");

var ConversationSchema = new mongoose.Schema({
    participants: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    messages: [{type: mongoose.Schema.Types.ObjectId, ref: "Message"}],
    time: Date
});

module.exports = mongoose.model("Conversation", ConversationSchema);