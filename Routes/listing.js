const express = require('express');
const router = express.Router();
const wrapAsync = require('../utils/WrapAsync.js')
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer  = require('multer');
const {storage} = require('../cloudconfig.js');
const upload = multer({storage:storage , limits: { fileSize: 1024 * 1024 * 2 }});

router
    .route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn , upload.single('listing[image]') , validateListing , wrapAsync(listingController.createListing));

//New Route
router.get("/new", isLoggedIn, listingController.newlistingForm);

router
    .route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isLoggedIn, isOwner, upload.single('listing[image]') , validateListing, wrapAsync(listingController.updateListing))
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.editListingForm));

module.exports = router;