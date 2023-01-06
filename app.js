require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require ("mongoose");
// npm i passport passport-local passport-local-mongoose express-session
const session = require("express-session");
const passport = require ("passport");
const passportLocalMongoose = require ("passport-local-mongoose");
const LocalStrategy = require('passport-local');




const app = express();

app.use (express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));


    // express-session package
app.use(session({
secret: "Our little secret",
resave: false,
saveUninitialized:false,
}));

//passport package
app.use (passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery', false); //deprecation warning
mongoose.connect('mongodb://127.0.0.1:27017/userDB', {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email:String,
    password:String
});

//passport package conecta ao Mongo
userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User",userSchema);

//configurar passport-local-mongoose 
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function(req,res){
    res.render("home");
});

app.get("/login", function(req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
});

app.get("/logout",function(req,res){
req.logout(function(err){
    if (err){
        console.log(err);
    }
});
res.redirect("/");
});

app.post("/register",function(req,res){
   User.register({username : req.body.username}, req.body.password, function(err, newUser){
if (err) {
    console.log(err);
    res.redirect("/register")
}else{
    passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
    });
}
   });
    
});

app.post ("/login",function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
  req.login(user, function(err){
    if(err){
        console.log(err);
    }else{
        passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
        });
    }
  });
});

app.listen(3000,function() {
    console.log("Server started on port 3000");
});