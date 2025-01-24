if(process.env.NODE_ENV!="production"){
  require('dotenv').config()
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const db_url = process.env.ATLASDB_URL;
const fs = require('fs');
const ExpressError = require('./utils/ExpressError.js');
const session = require('express-session');
const mongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const User = require('./models/user.js');

const listings = require('./Routes/listing.js');//router
const reviews = require('./Routes/review.js');//router
const user = require('./Routes/user.js');//router

const Fuse = require('fuse.js');
const Listing = require("./models/listing.js");

main()
  .then(() => {
    console.log("connected to DB");
    // var connection = mongoose.connection;
    // const collection = connection.db.collection<Listing>(MONGODB_COLLECTION);
    // await collection.createIndexes()
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  mongoose.connect(db_url);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = mongoStore.create({
  mongoUrl: db_url,
  crypto:{
    secret: process.env.SECRET
  },
  touchAfter:24*3600
})

store.on("error",()=>{
  console.log("Error in mongoStore",err);
})

const sessionOptions = {
  store,
  secret : process.env.SECRET,
  resave : false,
  saveUninitialized : true,
  cookie : {
    expires : Date.now() + 7*24*60*1000,
    maxAge : 7*24*60*1000,
    httpOnly : true
  }
}

const options = {
  // includeScore: true,
  keys: ['title' , 'description' , 'country' , 'location']
}


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser()) ;
passport.deserializeUser(User.deserializeUser()) ;

app.use((req,res,next)=>{
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currUser = req.user;
  next();
})

app.use("/listings",listings);
app.use("/listings/:id/reviews",reviews);
app.use("/",user);

app.get('/results',async (req,res)=>{
  const list = await Listing.find();
  const fuse = new Fuse(list, options);
  let resultsArr = fuse.search(req.query.search);
  let results = resultsArr;
  res.render("listings/results.ejs" ,{results});

});

app.all("*", (req, res, next) => {
  next(new ExpressError(404, "page not found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went Wrong!!" } = err;
  res.status(statusCode).render("error.ejs", { message, err });
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});