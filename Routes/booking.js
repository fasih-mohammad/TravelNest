const express = require("express");
const router = express.Router();
const WrapAsync = require("../utils/WrapAsync.js");
const { isLoggedIn } = require("../middleware.js");
const { allBooking, cancelBooking, newBooking, bookingForm } = require("../controllers/booking.js") ;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.get(
    "/:id/book",
    isLoggedIn,
    WrapAsync(bookingForm)
);


// Create a new booking
router.post(
    "/:id/book",
    isLoggedIn,
    WrapAsync(newBooking)
);

// View user bookings
router.get(
    "/bookings",
    isLoggedIn,
    WrapAsync(allBooking)
);

// Cancel a booking
router.delete(
    "/bookings/:id",
    isLoggedIn,
    WrapAsync(cancelBooking)
);


module.exports = router;