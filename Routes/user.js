const express = require('express');
const router = express.Router();
const User = require("../models/user.js");
const Booking = require("../models/booking.js");
const { isLoggedIn } = require("../middleware.js");
const WrapAsync = require('../utils/WrapAsync.js');
const passport = require('passport');
const { saveRedirectUrl } = require('../middleware.js');
const { signUp, renderSignUpForm, renderLoginForm, login, logOut } = require('../controllers/user.js');

// Render user profile
router.get(
    "/profile",
    isLoggedIn,
    WrapAsync(async (req, res) => {
        const user = await User.findById(req.user._id).populate("bookings");
        const bookings = await Booking.find({ userId: req.user._id }).populate("listingId");
        res.render("users/profile.ejs", { user, bookings });
    })
);

router
    .route("/signup")
    .get(renderSignUpForm)
    .post(WrapAsync(signUp));

router
    .route("/login")
    .get(renderLoginForm)
    .post(saveRedirectUrl, passport.authenticate("local",{failureRedirect:'/login',failureFlash:true}) ,login);

router.get("/logout",logOut);

module.exports = router;