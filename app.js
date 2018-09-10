var express         = require("express"),
    app             = express(),
    bodyParser      = require("body-parser"),
    mongoose        = require("mongoose"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    User            = require("./models/user"),
    Conversation    = require("./models/conversation");
    

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

// Connected a database
var url = "mongodb://localhost/socialite";
mongoose.connect(url);


app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   next();
});

// All the routes start here. Should be moved to a different file.

// The landing page route (entry route)
app.get("/", function(req, res) {
    res.render("landing");
});

// this page shows the contact and the message to send.
app.get("/talk", function(req, res) {
    User.findById(req.user._id).populate(["contacts", "conversations"]).exec(function(err, user) {
        if (err) {
            console.log(err);
        } else {
            res.render("social/convo", {user: user});
        }
    });
});

// Creating a convo between two people (Suppose the function recieves the info about the two people)
app.post("/talk", function(req, res) {
    var sender, reciever, newConversation;
    
    User.findById(req.user._id).populate(["conversations"]).exec(function(err, Sender) {
        sender = Sender;
        // console.log(sender); // this works
        User.find({"username": req.body.username}).populate(["conversations"]).exec(function(err, Reciever) {
            reciever = Reciever[0];
            if (Sender.conversations.length < 1) {
                // console.log("no convo case trig\n");
                    newConversation = { sender: Sender, reciever: reciever, messages: [], time: new Date()};
                    newConversation.messages.push(req.body.message);
                    // console.log("convo is: \n" + newConversation + "\n"); // this works
                    Conversation.create(newConversation, function(err, newlyCreated) {
                        if (err) {
                            console.log("\n error is:" + err + "\n");
                        }
                        // console.log("convo is: \n" + newlyCreated + "\n"); // this works
                        User.findByIdAndUpdate(sender._id, {$push: {conversations: newlyCreated}}, {new: true}, function(err, updatedSender) {
                            updatedSender.save();
                            // console.log("final callback for sender is:\n "+ updatedSender +"\n"); // this works
                            User.update({username: req.body.username}, {$push: {conversations: newlyCreated}}, {new: true}, function(err, updatedReciever) {
                                // console.log("Last callback and recievr id is:\n "+ updatedReciever + "\n");
                            });
                        });
                    });
            } else {
                console.log("convo exists case trig");
                sender.conversations.forEach(function(conversation) {
                    Conversation.findById(conversation._id).populate(["sender", "reciever"]).exec(function(err, convo) {
                        // console.log(convo + "\n"); // this works
                        // console.log("conversation.reciever.id: " + convo.reciever._id + "reciever id: " + reciever._id); //these two are the same.
                        if (convo.reciever._id.equals(reciever._id) || convo.sender._id.equals(reciever._id)) {
                            Conversation.findByIdAndUpdate(convo._id, {$push: {messages: req.body.message}}, {new: true}, function(err, updatedConversation) {
                                updatedConversation.save();
                                console.log("Last callback if the convos exist and the updated convo is: \n"+updatedConversation);
                            });
                        }
                    });
                });
            }
        });
    });
});

// This is the page to add friends. this functionality will chnage it will be search based after completion.
app.get("/connect", function(req, res) {
    User.find({_id: { $ne: req.user._id }}, function(err, allUsers) {
        if (err) {
            console.log(err);
        } else {
            res.render("social/connect", {users: allUsers});    
        }
    });
});


app.post("/connect/:UserID", function(req, res) {
    User.find( { _id : {$in: [req.params.UserID, req.user._id] } }, function(err, people) {
        var Sender = people[1];
        var Reciever = people[0];
        User.findByIdAndUpdate(Sender._id, {$push: {contacts: Reciever}} , {new: true}, function(err, updatedSender) {
                updatedSender.save();
        });
        User.findByIdAndUpdate(Reciever._id, {$push: {contacts: Sender}} , {new: true}, function(err, updatedSender) {
            updatedSender.save();
        });
        res.render("landing");
    });
});



// The login page route and logic routes
app.get("/login", function(req, res) {
    res.render("login");
});

app.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/",
        failureRedirect: "/login"
    }));

// The sign up page route and logic routes
app.get("/register", function(req, res) {
    res.render("register");
});

app.post("/register", function(req, res) {
   var newUser = new User({username: req.body.username, contacts: [ ], conversations: [ ]});
   User.register(newUser, req.body.password, function(err, user) {
       if (err) {
           console.log(err);
           return res.render("register");
       }
       passport.authenticate("local")(req, res, function() { //this line will call the serializer and deserializer method of passport.
           res.redirect("/");
       });
   });
});

// logout route
app.get("/logout", function(req, res){
   req.logout();
   res.redirect("/");
});


app.listen(process.env.PORT, process.env.IP, function() {
   console.log("The Socialite Server is live!");
});

// todo
// Need to make a page to show prospectives and add logic to add Users in their contacts, Dont forget to remove the User from the Prospectives.
// Add a searchbar to add Users.
// dont show all the Users in the Add friends page.