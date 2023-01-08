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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require("passport-facebook").Strategy;





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
    password:String,
    googleId: String,
    facebookId: String,
    secret: String

});

//passport package plugin para conectar ao Mongo
userSchema.plugin(passportLocalMongoose);
//mongoose plugin para utilizar findorcreate
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User",userSchema);

//configurar passport-local-mongoose 
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
// google authorization
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"

  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

//facebook authorization  

passport.use(new FacebookStrategy({
    clientID: process.env.FB_ID,
    clientSecret: process.env.FB_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req,res){
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ['profile'] }));


  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

  app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get("/login", function(req,res){
    res.render("login");
});

app.get("/register", function(req,res){
    res.render("register");
});

app.get("/secrets", function(req, res){
    User.find({"secret": {$ne:null}},function(err, foundUsers){
        if (err){
            console.log(err);
        }else{
            res.render("secrets", {usersWithSecrets: foundUsers})
        }
    });
});

app.get("/submit", function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit", function(req,res){
    const submittedSecret = req.body.secret;
    // because mongoose returns the id as an object (ObjectId) and you can't extract it like that. Try to use req.user.id.toString(
    
    User.findById(req.user._id.toString(), function(err, foundUser){
        if (err){
            console.log(err);
        }else{
            if (foundUser){
                foundUser.secret=submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
                
            };
        }
    });
    
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