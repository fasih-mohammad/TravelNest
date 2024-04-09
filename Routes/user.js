const express = require('express');
const router = express.Router();

const WrapAsync = require('../utils/WrapAsync.js');
const passport = require('passport');
const { saveRedirectUrl } = require('../middleware.js');
const { signUp, renderSignUpForm, renderLoginForm, login, logOut } = require('../controllers/user.js');

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